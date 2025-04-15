'use client'
// /app/page.js
import { useState, useEffect } from "react";
import GameCanvas from "./components/canvas";

export default function Home() {
  const [gameState, setGameState] = useState({
    grid: [],
    gems: [],
    collectedGems: 0,
  });

  const GRID_SIZE = 5;

  // 그리드와 보석 초기화
  useEffect(() => {
    const initialGrid = Array(GRID_SIZE)
      .fill()
      .map(() =>
        Array(GRID_SIZE)
          .fill()
          .map(() => ({
            depth: Math.floor(Math.random() * 10) + 1, // 1~10 사이의 랜덤 깊이
            state: "intact",
          }))
      );

    // 보석 위치 설정 (겹치지 않도록)
    const initialGems = [];
    const occupied = new Set();

    const addGem = (row, col, size) => {
      if (size === 4) {
        if (row + 1 >= GRID_SIZE || col + 1 >= GRID_SIZE) return false;
        const positions = [
          `${row},${col}`,
          `${row},${col + 1}`,
          `${row + 1},${col}`,
          `${row + 1},${col + 1}`,
        ];
        if (positions.some((pos) => occupied.has(pos))) return false;
        positions.forEach((pos) => occupied.add(pos));
      } else {
        const pos = `${row},${col}`;
        if (occupied.has(pos)) return false;
        occupied.add(pos);
      }
      initialGems.push({ row, col, size, collected: false });
      return true;
    };

    let gemsAdded = 0;
    while (gemsAdded < 3) {
      const row = Math.floor(Math.random() * GRID_SIZE);
      const col = Math.floor(Math.random() * GRID_SIZE);
      const size = Math.random() > 0.5 ? 4 : 1;
      if (addGem(row, col, size)) {
        gemsAdded++;
      }
    }

    setGameState({
      grid: initialGrid,
      gems: initialGems,
      collectedGems: 0,
    });

    // console.log("Initial Grid:", initialGrid);
    // console.log("Initial Gems:", initialGems);
  }, []);

  // "치대" 버튼 기능
  const handleChisel = () => {
    const newGrid = [...gameState.grid.map((row) => [...row])];
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        if (newGrid[row]?.[col]?.state === "intact") {
          newGrid[row][col].depth -= 1;
          if (newGrid[row][col].depth === 0) {
            newGrid[row][col].state = "broken";
          }
          setGameState((prev) => ({ ...prev, grid: newGrid }));
          return;
        }
      }
    }
  };

  return (
    <div className=" text-center p-5 flex flex-col items-center justify-center">
      {/* 상단 UI */}
      <div
        style={{
          backgroundColor: "#f4c430",
          padding: "10px",
          marginBottom: "10px",
          borderRadius: "10px",
        }}
        className="w-full"
      >
        <h1>숨겨진 사원</h1>
        <p>1번 23시간</p>
        <div style={{ display: "flex", justifyContent: "space-around" }}>
          <div>상자 1</div>
          <div>상자 2</div>
          <div>상자 3</div>
          <div>상자 4</div>
          <button>열기</button>
          <button>관문</button>
        </div>
      </div>

      {/* 캔버스 컴포넌트 (반응형 div 안에 배치) */}
      <div className="w-full max-w-[800px] min-w-[300px] mx-auto overflow-x-auto flex justify-center">
        <GameCanvas gameState={gameState} setGameState={setGameState} />
      </div>

      {/* 치대 버튼 */}
      {/* <div style={{ marginTop: "10px" }}>
        <button onClick={handleChisel}>치대</button>
      </div> */}

      {/* 수집한 보석 표시 */}
      <p>수집한 보석: {gameState.collectedGems}</p>
    </div>
  );
}