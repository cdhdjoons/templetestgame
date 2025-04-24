// /components/GameCanvas.js
"use client";

import { useRef, useEffect, useState } from "react";

export default function GameCanvas({ gameState, setGameState }) {
    const canvasRef = useRef(null);
    const GRID_SIZE = 5;
    const [tileSize, setTileSize] = useState(0); // TILE_SIZE 동적으로 계산
    const [blockImages, setBlockImages] = useState({}); // depth 구간별 이미지 저장
    const [gemImages, setGemImages] = useState({}); // 보석 이미지 저장

    // depth에 따른 이미지 경로 매핑
    const getBlockImageSrc = (depth) => {
        if (depth >= 7) {
            return "/images/block.png"; // depth 10~7
        } else if (depth >= 4) {
            return "/images/block_2.png"; // depth 6~4
        } else {
            return "/images/block_3.png"; // depth 3~1
        }
    };

    // 보석 이미지 경로 (size에 따라 다름)
    const getGemImageSrc = (size) => {
        return size === 1 ? "/images/gem_small.png" : "/images/gem_large.png";
    };

    // 이미지 미리 로드
    useEffect(() => {
        const imageSources = [];
        // 5x5 그리드에 대해 모든 블록 위치의 이미지 경로 생성
        for (let row = 0; row < GRID_SIZE; row++) {
            for (let col = 0; col < GRID_SIZE; col++) {
                const src = getBlockImageSrc(row, col);
                imageSources.push(src);
            }
        }
        // 보석 이미지 추가
        imageSources.push("/images/gem_small.png");
        imageSources.push("/images/gem_large.png");

        const loadedImages = {};
        let loadedCount = 0;

        imageSources.forEach((src) => {
            const img = new Image();
            img.src = src;
            img.onload = () => {
                loadedImages[src] = img;
                loadedCount++;
                if (loadedCount === imageSources.length) {
                    setBlockImages(loadedImages);
                    setGemImages({
                        "/images/gem_small.png": loadedImages["/images/gem_small.png"],
                        "/images/gem_large.png": loadedImages["/images/gem_large.png"],
                    });
                }
            };
            img.onerror = () => {
                console.error(`Failed to load image: ${src}`);
                loadedCount++;
                if (loadedCount === imageSources.length) {
                    setBlockImages(loadedImages);
                    setGemImages({
                        "/images/gem_small.png": null,
                        "/images/gem_large.png": null,
                    });
                }
            };
        });
    }, []);

    // 보석이 차지하는 모든 칸이 깨졌는지 확인 (수집 조건)
    const isGemFullyRevealed = (gem, grid) => {
        const { row, col, size } = gem;
        if (size === 1) {
            return grid[row]?.[col]?.state === "broken";
        } else {
            return (
                grid[row]?.[col]?.state === "broken" &&
                grid[row]?.[col + 1]?.state === "broken" &&
                grid[row + 1]?.[col]?.state === "broken" &&
                grid[row + 1]?.[col + 1]?.state === "broken"
            );
        }
    };

    // 보석이 차지하는 영역에 클릭이 포함되는지 확인
    const isClickOnGem = (row, col, gem) => {
        const { row: gemRow, col: gemCol, size } = gem;
        if (size === 1) {
            return row === gemRow && col === gemCol;
        } else {
            return (
                row >= gemRow &&
                row <= gemRow + 1 &&
                col >= gemCol &&
                col <= gemCol + 1
            );
        }
    };

    // 캔버스 그리기 함수
    const drawGrid = (ctx, grid, gems) => {
        if (!grid || !Array.isArray(grid) || grid.length === 0 || tileSize === 0) {
            return;
        }

        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        // 1. 맨바닥(깨진 블록) 먼저 그리기
        for (let row = 0; row < GRID_SIZE; row++) {
            for (let col = 0; col < GRID_SIZE; col++) {
                const x = col * tileSize;
                const y = row * tileSize;

                if (grid[row]?.[col]?.state === "broken") {
                    ctx.fillStyle = ""; // Tailwind의 gray-600
                    ctx.fillRect(x, y, tileSize, tileSize);

                    // 검정색 테두리 추가
                    ctx.strokeStyle = "#000000";
                    ctx.lineWidth = 1;
                    ctx.strokeRect(x, y, tileSize, tileSize);
                }
            }
        }

        // 2. 보석 그리기 (맨바닥 위에 렌더링)
        gems?.forEach((gem) => {
            const { row, col, size, collected } = gem;
            if (collected) return;

            const x = col * tileSize;
            const y = row * tileSize;
            const gemWidth = size === 1 ? tileSize : 2 * tileSize;
            const gemHeight = size === 1 ? tileSize : 2 * tileSize;

            const imageSrc = getGemImageSrc(size);
            const gemImage = gemImages[imageSrc];

            // 이미지가 로드되었으면 이미지로 그리기, 아니면 대체 색상 사용
            if (gemImage) {
                ctx.drawImage(gemImage, x, y, gemWidth, gemHeight);
            } else {
                // 대체 색상 (기존 보라색)
                ctx.fillStyle = "#a855f7"; // Tailwind의 purple-500
                ctx.fillRect(x, y, gemWidth, gemHeight);
            }
        });

        // 3. 깨지지 않은 블록 그리기 (보석과 맨바닥을 가림)
        for (let row = 0; row < GRID_SIZE; row++) {
            for (let col = 0; col < GRID_SIZE; col++) {
                const x = col * tileSize;
                const y = row * tileSize;

                if (grid[row]?.[col]?.state === "intact") {
                    const depth = grid[row][col].depth;
                    const imageSrc = getBlockImageSrc(depth);
                    const blockImage = blockImages[imageSrc];
                    // depth에 따라 색상 설정
                    // 이미지가 로드되었으면 이미지로 그리기, 아니면 대체 색상 사용
                    if (blockImage) {
                        ctx.drawImage(blockImage, x, y, tileSize, tileSize);
                    } else {
                        // 이미지 로드 전 또는 실패 시 대체 색상
                        if (depth >= 7) {
                            ctx.fillStyle = "#7f1d1d"; // 10~7: red-900
                        } else if (depth >= 4) {
                            ctx.fillStyle = "#991b1b"; // 6~4: red-800
                        } else {
                            ctx.fillStyle = "#b91c1c"; // 3~1: red-700
                        }
                        ctx.fillRect(x, y, tileSize, tileSize);
                    }

                    // 검정색 테두리 추가
                    ctx.strokeStyle = "";
                    ctx.lineWidth = 0;
                    ctx.strokeRect(x, y, tileSize, tileSize);

                    // 깊이 숫자 표시 (디버깅용)
                    // ctx.fillStyle = "white";
                    // const fontSize = Math.max(12, tileSize / 5); // 최소 12px, tileSize에 비례
                    // ctx.font = `${fontSize}px Arial`;
                    // ctx.fillText(depth, x + tileSize / 2 - (depth >= 10 ? 8 : 5), y + tileSize / 2 + fontSize / 3)
                }
            }
        }
    };

    // 캔버스 크기 동적 조정 및 TILE_SIZE 계산
    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");

        const resizeCanvas = () => {
            // 캔버스의 표시 크기 가져오기 (CSS 크기)
            const displayWidth = canvas.clientWidth;
            const displayHeight = canvas.clientHeight;

            // 최소 크기 설정 (최소 너비 200px)
            const minCanvasSize = 200;
            const canvasSize = Math.max(minCanvasSize, Math.min(displayWidth, 800));

            // 캔버스의 내부 픽셀 크기 동기화
            canvas.width = canvasSize;
            canvas.height = canvasSize;

            // TILE_SIZE를 캔버스 너비의 20%로 설정
            const newTileSize = displayWidth / GRID_SIZE;
            setTileSize(newTileSize);

            // 캔버스 다시 그리기
            drawGrid(ctx, gameState.grid, gameState.gems);
        };

        // 초기 크기 설정
        resizeCanvas();

        // 창 크기 변화 감지
        const observer = new ResizeObserver(resizeCanvas);
        observer.observe(canvas);

        return () => observer.disconnect();
    }, [gameState, blockImages, gemImages]);

    // 클릭 및 터치 이벤트 처리
    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");

        const handleInteraction = (x, y) => {
            const rect = canvas.getBoundingClientRect();
            const adjustedX = x - rect.left;
            const adjustedY = y - rect.top;

            const col = Math.floor(adjustedX / tileSize);
            const row = Math.floor(adjustedY / tileSize);

            if (row >= 0 && row < GRID_SIZE && col >= 0 && col < GRID_SIZE) {
                const newGrid = [...gameState.grid.map((row) => [...row])];
                const newGems = [...gameState.gems];

                // 1. 블록이 있는 경우: 블록 깊이 감소
                if (newGrid[row]?.[col]?.state === "intact") {
                    newGrid[row][col].depth -= 1;
                    //   console.log(`Clicked/Touched (${row}, ${col}), new depth:`, newGrid[row][col].depth);

                    if (newGrid[row][col].depth === 0) {
                        newGrid[row][col].state = "broken";
                        // console.log(`Block at (${row}, ${col}) is now broken`);
                    }
                }
                // 2. 블록이 깨진 상태이고 보석이 있는 경우: 보석 수집
                else if (newGrid[row]?.[col]?.state === "broken") {
                    const gemIndex = newGems.findIndex(
                        (gem) => !gem.collected && isClickOnGem(row, col, gem) && isGemFullyRevealed(gem, newGrid)
                    );
                    if (gemIndex !== -1) {
                        newGems[gemIndex].collected = true;
                        // console.log(`Gem collected at (${newGems[gemIndex].row}, ${newGems[gemIndex].col})`);
                        setGameState((prev) => ({
                            ...prev,
                            collectedGems: prev.collectedGems + 1,
                        }));
                    }
                }

                setGameState((prev) => ({
                    ...prev,
                    grid: newGrid,
                    gems: newGems,
                }));
            }
        };

        // 클릭 이벤트 핸들러
        const handleClick = (event) => {
            handleInteraction(event.clientX, event.clientY);
        };

        // 터치 이벤트 핸들러
        const handleTouch = (event) => {
            if (event.touches.length > 1) return;

            event.preventDefault(); // 기본 터치 동작(스크롤 등) 방지
            const touch = event.touches[0];
            handleInteraction(touch.clientX, touch.clientY);
        };

        // 이벤트 리스너 등록
        canvas.addEventListener("click", handleClick);
        canvas.addEventListener("touchstart", handleTouch);

        // 클린업
        return () => {
            canvas.removeEventListener("click", handleClick);
            canvas.removeEventListener("touchstart", handleTouch);
        };
    }, [gameState, setGameState, tileSize])

    return (
        <canvas
            ref={canvasRef}
            className="w-full aspect-square rounded-lg shadow-md"
            style={{ objectFit: "contain" }}
        />
    );
}