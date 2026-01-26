import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Camera, RotateCcw, Check, Loader2, CameraOff } from 'lucide-react';

interface CapturaFotoProps {
  onCapture: (photoDataUrl: string) => void;
  onCancel: () => void;
  isUploading?: boolean;
}

export default function CapturaFoto({
  onCapture,
  onCancel,
  isUploading = false,
}: CapturaFotoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  const startCamera = useCallback(async () => {
    setIsInitializing(true);
    setError(null);

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      });

      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Não foi possível acessar a câmera. Verifique as permissões.');
    } finally {
      setIsInitializing(false);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  }, [stream]);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  const takePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Mirror the image for selfie camera
    context.translate(canvas.width, 0);
    context.scale(-1, 1);
    context.drawImage(video, 0, 0);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
    setCapturedPhoto(dataUrl);
    stopCamera();
  }, [stopCamera]);

  const retakePhoto = useCallback(() => {
    setCapturedPhoto(null);
    startCamera();
  }, [startCamera]);

  const confirmPhoto = useCallback(() => {
    if (capturedPhoto) {
      onCapture(capturedPhoto);
    }
  }, [capturedPhoto, onCapture]);

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardContent className="pt-6 space-y-4">
        <div className="relative aspect-[4/3] bg-muted rounded-lg overflow-hidden">
          {isInitializing && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
            </div>
          )}

          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center">
              <CameraOff className="h-16 w-16 text-muted-foreground" />
              <p className="text-muted-foreground">{error}</p>
              <Button variant="outline" onClick={startCamera}>
                Tentar novamente
              </Button>
            </div>
          )}

          {!capturedPhoto && !error && (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
              style={{ transform: 'scaleX(-1)' }}
            />
          )}

          {capturedPhoto && (
            <img
              src={capturedPhoto}
              alt="Foto capturada"
              className="w-full h-full object-cover"
            />
          )}

          <canvas ref={canvasRef} className="hidden" />
        </div>

        <div className="flex gap-3">
          {!capturedPhoto ? (
            <>
              <Button
                variant="outline"
                size="lg"
                className="flex-1 h-14"
                onClick={onCancel}
                disabled={isUploading}
              >
                Cancelar
              </Button>
              <Button
                size="lg"
                className="flex-1 h-14"
                onClick={takePhoto}
                disabled={isInitializing || !!error || isUploading}
              >
                <Camera className="mr-2 h-5 w-5" />
                Tirar Foto
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                size="lg"
                className="flex-1 h-14"
                onClick={retakePhoto}
                disabled={isUploading}
              >
                <RotateCcw className="mr-2 h-5 w-5" />
                Tirar Outra
              </Button>
              <Button
                size="lg"
                className="flex-1 h-14"
                onClick={confirmPhoto}
                disabled={isUploading}
              >
                {isUploading ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <Check className="mr-2 h-5 w-5" />
                )}
                Confirmar
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
