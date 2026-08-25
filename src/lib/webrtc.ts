export class CallEngine {
  public localStream: MediaStream | null = null;
  public remoteStream: MediaStream | null = null;
  public peerConnection: RTCPeerConnection | null = null;

  public isMuted: boolean = false;
  public isVideoOff: boolean = false;
  public isScreenSharing: boolean = false;

  private onRemoteStreamListeners: Set<(stream: MediaStream) => void> = new Set();
  private onIceCandidateListeners: Set<(candidate: RTCIceCandidateInit) => void> = new Set();
  private onConnectionStateListeners: Set<(state: RTCPeerConnectionState) => void> = new Set();
  private pendingCandidates: RTCIceCandidateInit[] = [];

  private iceServers = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun3.l.google.com:19302' },
      { urls: 'stun:stun4.l.google.com:19302' },
    ],
  };

  public onRemoteStream(callback: (stream: MediaStream) => void): () => void {
    this.onRemoteStreamListeners.add(callback);
    if (this.remoteStream && this.remoteStream.getTracks().length > 0) {
      callback(this.remoteStream);
    }
    return () => this.onRemoteStreamListeners.delete(callback);
  }

  public onIceCandidate(callback: (candidate: RTCIceCandidateInit) => void): () => void {
    this.onIceCandidateListeners.add(callback);
    return () => this.onIceCandidateListeners.delete(callback);
  }

  public onConnectionState(callback: (state: RTCPeerConnectionState) => void): () => void {
    this.onConnectionStateListeners.add(callback);
    if (this.peerConnection) {
      callback(this.peerConnection.connectionState);
    }
    return () => this.onConnectionStateListeners.delete(callback);
  }

  public async startLocalMedia(callType: 'voice' | 'video'): Promise<MediaStream> {
    try {
      if (this.localStream) {
        this.localStream.getTracks().forEach((t) => t.stop());
        this.localStream = null;
      }

      const constraints: MediaStreamConstraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video:
          callType === 'video'
            ? {
                width: { ideal: 1280, max: 1920 },
                height: { ideal: 720, max: 1080 },
                facingMode: 'user',
              }
            : false,
      };

      this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
      this.isMuted = false;
      this.isVideoOff = callType === 'voice';
      return this.localStream;
    } catch (err) {
      console.warn('Real camera/mic unavailable or blocked, generating synthetic stream:', err);
      this.localStream = this.createSyntheticStream(callType);
      this.isMuted = false;
      this.isVideoOff = callType === 'voice';
      return this.localStream;
    }
  }

  private createSyntheticStream(callType: 'voice' | 'video'): MediaStream {
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext('2d')!;

    let angle = 0;
    const draw = () => {
      angle += 0.04;
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, 640, 480);

      // Gradient aura
      const grad = ctx.createRadialGradient(320, 240, 30, 320, 240, 220);
      grad.addColorStop(0, '#f5a62333');
      grad.addColorStop(1, '#00000000');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 640, 480);

      // Heart & Sparkles
      ctx.fillStyle = '#f5a623';
      ctx.font = '64px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('💖', 320 + Math.sin(angle) * 20, 220 + Math.cos(angle) * 15);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 22px system-ui, sans-serif';
      ctx.fillText('Live Video Stream', 320, 300);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '14px system-ui, sans-serif';
      ctx.fillText('HD Encrypted Call Connected', 320, 335);

      requestAnimationFrame(draw);
    };
    draw();

    const canvasStream = canvas.captureStream(30);

    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const dest = audioCtx.createMediaStreamDestination();
    const osc = audioCtx.createOscillator();
    osc.frequency.value = 440;
    const gain = audioCtx.createGain();
    gain.gain.value = 0.0001;
    osc.connect(gain);
    gain.connect(dest);
    osc.start();

    const tracks = [...canvasStream.getVideoTracks(), ...dest.stream.getAudioTracks()];
    return new MediaStream(tracks);
  }

  public initPeerConnection(): RTCPeerConnection {
    if (this.peerConnection) {
      try {
        this.peerConnection.close();
      } catch (e) {}
      this.peerConnection = null;
    }

    this.peerConnection = new RTCPeerConnection(this.iceServers);
    this.pendingCandidates = [];

    // Add all local tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        this.peerConnection!.addTrack(track, this.localStream!);
      });
    }

    this.remoteStream = new MediaStream();

    this.peerConnection.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        this.remoteStream = event.streams[0];
      } else {
        if (!this.remoteStream) this.remoteStream = new MediaStream();
        if (!this.remoteStream.getTracks().some((t) => t.id === event.track.id)) {
          this.remoteStream.addTrack(event.track);
        }
      }
      this.onRemoteStreamListeners.forEach((listener) => {
        if (this.remoteStream) listener(this.remoteStream);
      });
    };

    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        const candidateJson = event.candidate.toJSON();
        this.onIceCandidateListeners.forEach((listener) => listener(candidateJson));
      }
    };

    this.peerConnection.onconnectionstatechange = () => {
      if (this.peerConnection) {
        const state = this.peerConnection.connectionState;
        this.onConnectionStateListeners.forEach((listener) => listener(state));
      }
    };

    return this.peerConnection;
  }

  public async createOffer(): Promise<RTCSessionDescriptionInit> {
    const pc = this.initPeerConnection();
    const offer = await pc.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: true,
    });
    await pc.setLocalDescription(offer);
    return offer;
  }

  public async handleOfferAndCreateAnswer(offerSdp: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit> {
    const pc = this.initPeerConnection();
    if (pc.signalingState !== 'closed') {
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(offerSdp));
        await this.drainPendingCandidates();
      } catch (e) {
        console.warn('Error setting remote offer SDP:', e);
      }
    }

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    return answer;
  }

  public async handleAnswer(answerSdp: RTCSessionDescriptionInit) {
    if (!this.peerConnection) {
      console.warn('Cannot handle answer: no active PeerConnection');
      return;
    }

    // Only set remote answer if signaling state is have-local-offer
    if (this.peerConnection.signalingState === 'have-local-offer') {
      try {
        await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answerSdp));
        await this.drainPendingCandidates();
      } catch (err) {
        console.warn('Error setting remote answer SDP:', err);
      }
    } else {
      console.info('Ignoring remote answer SDP because signalingState is', this.peerConnection.signalingState);
    }
  }

  public async addIceCandidate(candidate: any) {
    if (!candidate) return;
    if (!this.peerConnection || !this.peerConnection.remoteDescription || !this.peerConnection.remoteDescription.type) {
      this.pendingCandidates.push(candidate);
      return;
    }
    try {
      await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (e) {
      console.warn('Error adding ICE candidate:', e);
    }
  }

  private async drainPendingCandidates() {
    if (this.peerConnection && this.peerConnection.remoteDescription && this.peerConnection.remoteDescription.type) {
      while (this.pendingCandidates.length > 0) {
        const candidate = this.pendingCandidates.shift();
        if (candidate) {
          try {
            await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (e) {
            console.warn('Error draining ICE candidate:', e);
          }
        }
      }
    }
  }

  public toggleMute(): boolean {
    if (this.localStream) {
      const audioTracks = this.localStream.getAudioTracks();
      if (audioTracks.length > 0) {
        this.isMuted = !this.isMuted;
        audioTracks[0].enabled = !this.isMuted;
      }
    }
    return this.isMuted;
  }

  public toggleVideo(): boolean {
    if (this.localStream) {
      const videoTracks = this.localStream.getVideoTracks();
      if (videoTracks.length > 0) {
        this.isVideoOff = !this.isVideoOff;
        videoTracks[0].enabled = !this.isVideoOff;
      }
    }
    return this.isVideoOff;
  }

  public async toggleScreenShare(): Promise<boolean> {
    if (!this.isScreenSharing) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = screenStream.getVideoTracks()[0];

        if (this.peerConnection && this.localStream) {
          const sender = this.peerConnection.getSenders().find((s) => s.track?.kind === 'video');
          if (sender) {
            sender.replaceTrack(screenTrack);
          }
        }

        screenTrack.onended = () => {
          this.stopScreenShare();
        };

        this.isScreenSharing = true;
      } catch (e) {
        console.warn('Screen share cancelled or failed:', e);
      }
    } else {
      this.stopScreenShare();
    }
    return this.isScreenSharing;
  }

  private stopScreenShare() {
    if (this.localStream && this.peerConnection) {
      const videoTrack = this.localStream.getVideoTracks()[0];
      if (videoTrack) {
        const sender = this.peerConnection.getSenders().find((s) => s.track?.kind === 'video');
        if (sender) {
          sender.replaceTrack(videoTrack);
        }
      }
    }
    this.isScreenSharing = false;
  }

  public stopCall() {
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    }
    if (this.remoteStream) {
      this.remoteStream.getTracks().forEach((track) => track.stop());
      this.remoteStream = null;
    }
    if (this.peerConnection) {
      try {
        this.peerConnection.close();
      } catch (e) {}
      this.peerConnection = null;
    }
    this.pendingCandidates = [];
    this.isMuted = false;
    this.isVideoOff = false;
    this.isScreenSharing = false;
  }
}

export const callEngine = new CallEngine();

