import {
  DeviceProfile,
  DevicePlatform,
  DeviceArchitecture,
  DeviceProfileClassification,
  RuntimeType,
  HardwareExecutionTarget,
} from '../../../types/snapdragon';

export class RuntimeDetector {
  private static cachedProfile: DeviceProfile | null = null;
  private static lastCheck = 0;

  /**
   * Evaluates the current host environment without fabricating hardware information.
   */
  static async detectDeviceProfile(): Promise<DeviceProfile> {
    const now = Date.now();
    if (this.cachedProfile && now - this.lastCheck < 15000) {
      return this.cachedProfile;
    }

    this.lastCheck = now;

    let platform: DevicePlatform = 'unknown';
    let architecture: DeviceArchitecture = 'unknown';
    let isARM64Windows = false;
    let npuAvailable = false;
    let runtime: RuntimeType = 'none';
    const supportedTargets: HardwareExecutionTarget[] = ['cpu'];
    let processorName: string | undefined = undefined;

    if (typeof navigator !== 'undefined' || typeof window !== 'undefined') {
      const nav = typeof navigator !== 'undefined' ? (navigator as any) : {};
      const ua = nav.userAgent || '';
      const lowerUa = ua.toLowerCase();

      // 1. Detect Platform
      if (lowerUa.includes('windows') || lowerUa.includes('win32') || lowerUa.includes('win64')) {
        platform = 'windows';
      } else if (lowerUa.includes('linux')) {
        platform = 'linux';
      } else if (lowerUa.includes('macintosh') || lowerUa.includes('mac os')) {
        platform = 'darwin';
      }

      // 2. Detect Architecture (Inspect userAgentData if available on Chromium)
      if (nav.userAgentData && typeof nav.userAgentData.getHighEntropyValues === 'function') {
        try {
          const values = await nav.userAgentData.getHighEntropyValues(['architecture', 'bitness', 'model', 'platformVersion']);
          if (values.architecture) {
            const archLower = String(values.architecture).toLowerCase();
            if (archLower.includes('arm')) {
              architecture = 'arm64';
            } else if (archLower.includes('x86') || archLower.includes('intel') || archLower.includes('amd')) {
              architecture = 'x86_64';
            }
          }
        } catch {
          // High entropy access restricted or denied
        }
      }

      // Fallback architecture inspection via user-agent strings
      if (architecture === 'unknown') {
        if (lowerUa.includes('arm64') || lowerUa.includes('arm') || lowerUa.includes('aarch64')) {
          architecture = 'arm64';
        } else if (lowerUa.includes('win64') || lowerUa.includes('x64') || lowerUa.includes('x86_64') || lowerUa.includes('wow64')) {
          architecture = 'x86_64';
        }
      }

      isARM64Windows = platform === 'windows' && architecture === 'arm64';

      // 3. Check for genuine Snapdragon QNN hardware bridge
      const qnnBridge =
        nav.__QUALCOMM_QNN_BRIDGE__ ||
        (typeof window !== 'undefined' && (window as any).__QUALCOMM_QNN_BRIDGE__) ||
        (typeof window !== 'undefined' && (window as any).__QUALCOMM_AI_ENGINE__);

      if (qnnBridge) {
        npuAvailable = true;
        runtime = 'snapdragon-qnn';
        if (!supportedTargets.includes('npu')) {
          supportedTargets.push('npu');
        }
        platform = 'windows';
        architecture = 'arm64';
        isARM64Windows = true;
        if (typeof qnnBridge.getProcessorName === 'function') {
          processorName = qnnBridge.getProcessorName();
        }
      } else {
        // Probe local Windows native companion IPC bridge if present
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 600);
          const res = await fetch('http://127.0.0.1:29999/health', {
            method: 'GET',
            signal: controller.signal,
          }).catch(() => null);

          clearTimeout(timeoutId);

          if (res && res.ok) {
            const data = await res.json().catch(() => ({}));
            if (data.qnnReady || data.target === 'npu') {
              npuAvailable = true;
              runtime = 'snapdragon-qnn';
              supportedTargets.push('npu');
              processorName = data.processor;
              platform = 'windows';
              architecture = 'arm64';
              isARM64Windows = true;
            }
          }
        } catch {
          // Bridge inactive
        }
      }

      // 4. Inspect WebGPU / DirectML execution support for local GPU acceleration
      if (nav.gpu && typeof nav.gpu.requestAdapter === 'function') {
        try {
          const adapter = await nav.gpu.requestAdapter().catch(() => null);
          if (adapter) {
            supportedTargets.push('gpu');
            if (runtime === 'none') {
              runtime = 'directml';
            }
          }
        } catch {
          // GPU adapter not granted
        }
      }
    }

    // Classify Device Profile truthfully
    let classification: DeviceProfileClassification = 'Unknown device';
    if (npuAvailable) {
      classification = 'Snapdragon NPU available';
    } else if (platform === 'windows') {
      if (isARM64Windows) {
        classification = 'Snapdragon NPU unavailable';
      } else {
        classification = 'Non-Snapdragon Windows';
      }
    } else {
      classification = 'Unknown device';
    }

    const profile: DeviceProfile = {
      platform,
      architecture,
      processor: processorName,
      npuAvailable,
      runtime,
      supportedTargets,
      classification,
      isARM64Windows,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
    };

    this.cachedProfile = profile;
    return profile;
  }

  /**
   * Reset cache for testing or manual re-probing
   */
  static clearCache(): void {
    this.cachedProfile = null;
    this.lastCheck = 0;
  }
}
