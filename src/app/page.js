'use client'
import { useState, useEffect } from "react";
import GameCanvas from "./components/canvas";

export default function Home() {
  const [gameState, setGameState] = useState({
    grid: [], // 초기값을 빈 배열로 설정
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
            depth: 1, // 1~3 사이의 랜덤 깊이
            state: "intact",
          }))
      );

    // 보석 위치 설정 (겹치지 않도록)
    const initialGems = [];
    const occupied = new Set(); // 겹침 방지를 위한 Set

    const addGem = (row, col, size) => {
      if (size === 4) {
        // 2x2 보석이 그리드 범위를 벗어나지 않도록 확인
        if (row + 1 >= GRID_SIZE || col + 1 >= GRID_SIZE) return false;
        // 겹치는지 확인
        const positions = [
          `${row},${col}`,
          `${row},${col + 1}`,
          `${row + 1},${col}`,
          `${row + 1},${col + 1}`,
        ];
        if (positions.some((pos) => occupied.has(pos))) return false;
        positions.forEach((pos) => occupied.add(pos));
      } else {
        // 1칸 보석
        const pos = `${row},${col}`;
        if (occupied.has(pos)) return false;
        occupied.add(pos);
      }
      initialGems.push({ row, col, size, collected: false });
      return true;
    };

    // 보석 3개 추가 (랜덤 크기)
    let gemsAdded = 0;
    while (gemsAdded < 3) {
      const row = Math.floor(Math.random() * GRID_SIZE);
      const col = Math.floor(Math.random() * GRID_SIZE);
      const size = Math.random() > 0.5 ? 4 : 1; // 50% 확률로 1칸 또는 4칸
      if (addGem(row, col, size)) {
        gemsAdded++;
      }
    }

    setGameState({
      grid: initialGrid,
      gems: initialGems,
      collectedGems: 0,
    });

    console.log("Initial Grid:", initialGrid);
    console.log("Initial Gems:", initialGems);
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
    <div className="flex flex-col justify-center items-center" style={{ textAlign: "center", padding: "20px" }}>
      {/* 상단 UI */}
      <div className="w-full text-black"
        style={{
          backgroundColor: "#f4c430",
          padding: "10px",
          marginBottom: "10px",
          borderRadius: "10px",
        }}
      >
        <h1>숨겨진 사원</h1>
        <p></p>
        <div className="flex justify-between text-black">
          {/* <div>상자 1</div>
          <div>상자 2</div>
          <div>상자 3</div>
          <div>상자 4</div>
          <button>열기</button>
          <button>관문</button> */}
        </div>
      </div>

      {/* 캔버스 컴포넌트 */}
      <GameCanvas gameState={gameState} setGameState={setGameState} />

      {/* 치대 버튼 */}
      {/* <div style={{ marginTop: "10px" }}>
        <button onClick={handleChisel}>치대</button>
      </div> */}

      {/* 수집한 보석 표시 */}
      <p>수집한 보석: {gameState.collectedGems}</p>
    </div>
  );
}