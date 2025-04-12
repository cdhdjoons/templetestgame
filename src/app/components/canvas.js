// /components/GameCanvas.js
"use client";

import { useRef, useEffect } from "react";

export default function GameCanvas({ gameState, setGameState }) {
    const canvasRef = useRef(null);
    const GRID_SIZE = 5;
    const TILE_SIZE = 100;

    // 보석이 차지하는 모든 칸이 깨졌는지 확인
    const isGemFullyRevealed = (gem, grid) => {
        const { row, col, size } = gem;
        if (size === 1) {
            return grid[row]?.[col]?.state === "broken";
        } else {
            // 2x2 보석
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
        if (!grid || !Array.isArray(grid) || grid.length === 0) {
            return;
        }

        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        // 1. 맨바닥(깨진 블록) 먼저 그리기
        for (let row = 0; row < GRID_SIZE; row++) {
            for (let col = 0; col < GRID_SIZE; col++) {
                const x = col * TILE_SIZE; // 간격 제거
                const y = row * TILE_SIZE; // 간격 제거

                if (grid[row]?.[col]?.state === "broken") {
                    ctx.fillStyle = "#4b5563"; // Tailwind의 gray-600
                    ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE); // 직사각형으로 변경

                    // 검정색 테두리 추가
                    ctx.strokeStyle = "#000000";
                    ctx.lineWidth = 1;
                    ctx.strokeRect(x, y, TILE_SIZE, TILE_SIZE);
                }
            }
        }

        // 2. 보석 그리기 (맨바닥 위에 렌더링)
        gems?.forEach((gem) => {
            const { row, col, size, collected } = gem;
            if (collected) return; // 이미 수집된 보석은 렌더링하지 않음

            if (size === 1) {
                // 1칸 보석
                const x = col * TILE_SIZE;
                const y = row * TILE_SIZE;
                ctx.fillStyle = "purple";
                ctx.beginPath();
                ctx.moveTo(x + TILE_SIZE / 2, y + 10);
                ctx.lineTo(x + TILE_SIZE - 10, y + TILE_SIZE - 10);
                ctx.lineTo(x + 10, y + TILE_SIZE - 10);
                ctx.closePath();
                ctx.fill();
            } else {
                // 2x2 보석
                const x = col * TILE_SIZE;
                const y = row * TILE_SIZE;
                ctx.fillStyle = "purple";
                ctx.beginPath();
                ctx.moveTo(x + TILE_SIZE, y + 20);
                ctx.lineTo(x + 2 * TILE_SIZE - 20, y + 2 * TILE_SIZE - 20);
                ctx.lineTo(x + 20, y + 2 * TILE_SIZE - 20);
                ctx.closePath();
                ctx.fill();
            }
        });

        // 3. 깨지지 않은 블록 그리기 (보석과 맨바닥을 가림)
        for (let row = 0; row < GRID_SIZE; row++) {
            for (let col = 0; col < GRID_SIZE; col++) {
                const x = col * TILE_SIZE;
                const y = row * TILE_SIZE;

                if (grid[row]?.[col]?.state === "intact") {
                    const depth = grid[row][col].depth;
                    ctx.fillStyle = depth === 3 ? "#8b5a2b" : depth === 2 ? "#a0522d" : "#cd853f";
                    ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE); // 직사각형으로 변경

                    // 검정색 테두리 추가
                    ctx.strokeStyle = "#000000";
                    ctx.lineWidth = 1;
                    ctx.strokeRect(x, y, TILE_SIZE, TILE_SIZE);

                    // 깊이 숫자 표시 (디버깅용)
                    ctx.fillStyle = "white";
                    ctx.font = "16px Arial";
                    ctx.fillText(depth, x + TILE_SIZE / 2 - 5, y + TILE_SIZE / 2);
                }
            }
        }
    };

    // 클릭 이벤트 처리
    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");

        const handleClick = (event) => {
            const rect = canvas.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;

            const col = Math.floor(x / TILE_SIZE);
            const row = Math.floor(y / TILE_SIZE);

            if (row >= 0 && row < GRID_SIZE && col >= 0 && col < GRID_SIZE) {
                const newGrid = [...gameState.grid.map((row) => [...row])];
                const newGems = [...gameState.gems];

                // 1. 블록이 있는 경우: 블록 깊이 감소
                if (newGrid[row]?.[col]?.state === "intact") {
                    newGrid[row][col].depth -= 1;
                    console.log(`Clicked (${row}, ${col}), new depth:`, newGrid[row][col].depth);

                    if (newGrid[row][col].depth === 0) {
                        newGrid[row][col].state = "broken";
                        console.log(`Block at (${row}, ${col}) is now broken`);
                    }
                }
                // 2. 블록이 깨진 상태이고 보석이 있는 경우: 보석 수집
                else if (newGrid[row]?.[col]?.state === "broken") {
                    const gemIndex = newGems.findIndex(
                        (gem) => !gem.collected && isClickOnGem(row, col, gem) && isGemFullyRevealed(gem, newGrid)
                    );
                    if (gemIndex !== -1) {
                        newGems[gemIndex].collected = true;
                        console.log(`Gem collected at (${newGems[gemIndex].row}, ${newGems[gemIndex].col})`);
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

        canvas.addEventListener("click", handleClick);
        return () => canvas.removeEventListener("click", handleClick);
    }, [gameState, setGameState]);

    // 게임 상태 변경 시 캔버스 다시 그리기
    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        drawGrid(ctx, gameState.grid, gameState.gems);
    }, [gameState]);

    return (
        <canvas
            ref={canvasRef}
            width={GRID_SIZE * TILE_SIZE}
            height={GRID_SIZE * TILE_SIZE}
            className="border-2 border-black bg-gray-200 shadow-md"
        />
    );
}