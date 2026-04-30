import type { PluginViewProps } from "mo-sdk";
import { useEffect, useState, useRef } from "react";
import { useTranslation } from "mo-sdk";

interface GazePoint {
    timestamp: number;
    data: number;
    normalizedTime: number;
}

const SYNC_TOLERANCE = 100;

export function GazePointView({ controls, context }: PluginViewProps) {
    //@ts-ignore
    const { t } = useTranslation("interaction-lab-gazepoint-playback");
    const [data, setData] = useState<GazePoint[]>([]);
    const [timeMs, setTimeMs] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [scaleX, setScaleX] = useState(50);
    const [scaleY, setScaleY] = useState(5);

    const timeMsRef = useRef(timeMs);
    const rafIdRef = useRef<number | null>(null);
    const lastRealTimeRef = useRef<number>(0);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        timeMsRef.current = timeMs;
    }, [timeMs]);

    useEffect(() => {
        const loadData = async () => {
            try {
                const raw = (await window.core.fs.readFileSync(context.filePath, "utf-8")) as string;
                const processedData = processGazeData(raw);
                setData(processedData);
            } catch (error) {
                console.error("Error loading gaze data:", error);
                setData([]);
            }
        };
        loadData();
    }, [context.filePath]);

    useEffect(() => {
        const unsubPlay = controls.onPlay((from) => {
            setTimeMs(from);
            lastRealTimeRef.current = performance.now();
            setIsPlaying(true);
        });
        const unsubPause = controls.onPause(() => {
            setIsPlaying(false);
        });
        const unsubSeek = controls.onSeek((to) => {
            setTimeMs(to);
            lastRealTimeRef.current = performance.now();
        });
        const unsubSync = controls.onSync((syncTime) => {
            if (Math.abs(syncTime - timeMsRef.current) > SYNC_TOLERANCE){
                setTimeMs(syncTime); 
                lastRealTimeRef.current = performance.now();
            }    
        });

        return () => {
            unsubPlay();
            unsubPause();
            unsubSeek();
            unsubSync();
        };
    }, [controls]);

    useEffect(() => {
        const tick = (now: number) => {
            const delta = now - lastRealTimeRef.current;
            lastRealTimeRef.current = now;
            setTimeMs((prev) => prev + delta);
            rafIdRef.current = requestAnimationFrame(tick);
        };

        if (isPlaying) {
            lastRealTimeRef.current = performance.now();
            rafIdRef.current = requestAnimationFrame(tick);
        } else {
            if (rafIdRef.current !== null) {
                cancelAnimationFrame(rafIdRef.current);
                rafIdRef.current = null;
            }
        }
        return () => {
            if (rafIdRef.current !== null)
                cancelAnimationFrame(rafIdRef.current);
        };
    }, [isPlaying]);

    const timeSeconds = Math.max(0, timeMs) / 1000;

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || data.length === 0)
            return;
        const ctx = canvas.getContext('2d');
        if (!ctx)
            return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        drawAxes(ctx, canvas.width, canvas.height);
        drawGazeData(ctx, canvas.width, canvas.height, data, timeSeconds);
        drawProgressLine(ctx, canvas.width, canvas.height);

    }, [data, timeSeconds, scaleX, scaleY]);

    const drawAxes = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
        const y0 = height / 1.2;
        
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;

        ctx.beginPath();
        ctx.moveTo(0, y0);
        ctx.lineTo(width, y0);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(50, 0);
        ctx.lineTo(50, height);
        ctx.stroke();

        ctx.fillStyle = '#000';
        ctx.font = '12px Arial';
        ctx.fillText('Pupil Diameter', 60, 20);
    };

    const drawGazeData = (ctx: CanvasRenderingContext2D, width: number, height: number, gazeData: GazePoint[], currentTimeSec: number) => {
        const y0 = height / 1.2;
        
        ctx.beginPath();
        ctx.strokeStyle = '#007bff';
        ctx.lineWidth = 1.5;

        let started = false;

        for (let i = 0; i < gazeData.length; i++) {
            const point = gazeData[i];
            const timeDiff = point.normalizedTime - currentTimeSec;
            const x = 50 + (timeDiff * scaleX);

            if (x < -100)
                continue;
            if (x > width + 100)
                break;

            const y = y0 - (point.data * scaleY); 

            if (!started) {
                ctx.moveTo(x, y);
                started = true;
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.stroke();
    };
    //@ts-ignore
    const drawProgressLine = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
        ctx.fillStyle = 'rgba(255, 117, 20, 0.5)';
        ctx.fillRect(50, 0, 10, height);
    };

    const increaseScaleX = () => setScaleX(prev => prev * 1.2);
    const decreaseScaleX = () => setScaleX(prev => prev / 1.2);
    const increaseScaleY = () => setScaleY(prev => prev * 1.2);
    const decreaseScaleY = () => setScaleY(prev => prev / 1.2);

    return (
        <div 
            style={{ 
                padding: '10px', 
                fontFamily: 'Arial, sans-serif', 
                background: '#f0f0f0', 
                borderRadius: '5px' 
            }}>
            <div 
                style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    marginBottom: '10px' 
                }}>
                <strong style={{color:'#333'}}>GazePoint 3 HD</strong>
                <div style={{ display: 'flex', gap: '5px' }}>
                    <button onClick={decreaseScaleY}>Amp -</button>
                    <button onClick={increaseScaleY}>Amp +</button>
                    <button onClick={decreaseScaleX}>Len -</button>
                    <button onClick={increaseScaleX}>Len +</button>
                </div>
            </div>

            <div 
                style={{ 
                    background: '#fff', 
                    border: '1px solid #999' 
                }}>
                <canvas
                    ref={canvasRef}
                    width={800}
                    height={300}
                    style={{ display: 'block', width: '100%' }}
                />
            </div>
            
            <div 
                style={{ 
                    marginTop: '5px', 
                    fontSize: '0.8rem', 
                    color: '#666' 
                }}>
                Time: {timeSeconds.toFixed(2)}s | Points: {data.length}
            </div>
        </div>
    );
}

function processGazeData(content: string): GazePoint[] {
    const lines = content.split('\n');
    const data: GazePoint[] = [];
    let firstTimestamp = -1;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line || !line.includes("t:"))
            continue;

        try {
            const tMatch = line.match(/t:(\d+)/);
            const lpsMatch = line.match(/lps:([\d.]+)/);

            if (tMatch && lpsMatch) {
                const ts = parseInt(tMatch[1]);
                const val = parseFloat(lpsMatch[1]);

                if (!isNaN(ts) && !isNaN(val)) {
                    if (firstTimestamp === -1)
                        firstTimestamp = ts;

                    data.push({
                        timestamp: ts,
                        data: val,
                        normalizedTime: (ts - firstTimestamp) / 1000
                    });
                }
            }
        } catch (e) {
        }
    }
    return data;
}