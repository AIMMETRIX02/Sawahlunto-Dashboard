'use client'

import React, { useMemo } from 'react'

interface DelayDiagramProps {
  delayData?: any // Can be array, matrix, or object from Unreal Engine
  title?: string
}

export const DelayDiagramUI = React.memo(function DelayDiagramUI({ delayData, title }: DelayDiagramProps) {
  // Parse data input from Unreal Engine flexible structure
  const parsedData = useMemo(() => {
    let raw = delayData

    // Parse JSON string if needed
    if (typeof raw === 'string') {
      try {
        raw = JSON.parse(raw)
      } catch (e) {
        raw = null
      }
    }

    // Default structure fallback
    const defaultGrid = [
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0],
    ]

    const defaultPerimeter = {
      top: [0, 0, 0, 0, 0],
      left: [0, 0, 0, 0, 0, 0, 0],
      right: [0, 0, 0, 0, 0, 0, 0],
      bottom: [0, 0, 0, 0, 0, 0],
    }

    const defaultBoxCut = {
      outer: [0, 0, 0, 0, 0, 0, 0, 0],
      inner: [0, 0, 0], // 3 yellow V-cut nodes
    }

    const parseVal = (val: any) => {
      if (typeof val === 'number') return val
      const parsed = parseInt(val, 10)
      return isNaN(parsed) ? 0 : parsed
    }

    const parseArr = (arr: any[]) => (Array.isArray(arr) ? arr.map(parseVal) : [])

    if (!raw) {
      return { grid: defaultGrid, perimeter: defaultPerimeter, boxCut: defaultBoxCut }
    }

    // Case 1: Simple 1D Flat Array of numbers from Unreal Engine (66 elements)
    if (Array.isArray(raw)) {
      if (typeof raw[0] === 'number' || (raw.length > 1 && typeof raw[1] === 'number')) {
        const flat = raw

        // Helper: Blueprint Hole N maps to flat[N-1] (1-based slot shift from Unreal Engine Blueprint)
        const getHole = (holeNum: number) => {
          if (holeNum === 0) return parseVal(flat[65] ?? flat[0] ?? 0)
          return parseVal(flat[holeNum - 1] ?? 0)
        }

        // Exact 1-to-1 Blueprint Index N to Hole N Mapping from Blueprint Diagram
        const outer = [
          getHole(8),  // 0: Top-Left Corner (Hole 8)
          getHole(5),  // 1: Top-Center Edge (Hole 5)
          getHole(9),  // 2: Top-Right Corner (Hole 9)
          getHole(4),  // 3: Right-Center Edge (Hole 4)
          getHole(10), // 4: Bottom-Right Corner (Hole 10 -> flat[9] = 25 ms!)
          getHole(3),  // 5: Bottom-Center Edge (Hole 3 -> flat[2] = 125 ms)
          getHole(7),  // 6: Bottom-Left Corner (Hole 7 -> flat[6] = 125 ms)
          getHole(6),  // 7: Left-Center Edge (Hole 6 -> flat[5] = 125 ms)
        ]

        const inner = [
          0,          // 0: Apex Yellow (No text data)
          getHole(1), // 1: Top-Left White (Hole 1)
          getHole(2), // 2: Top-Right White (Hole 2)
          getHole(0), // 3: Center White (Hole 0 -> flat[65] = 125 ms)
          0,          // 4: Left Base Yellow (No text data)
          0,          // 5: Right Base Yellow (No text data)
        ]

        // Grid Rows mapped from Hole Numbers (Top Row = Row 6 in Blueprint = Holes 53..57 down to Floor = Holes 19..23)
        const grid = [
          [getHole(53), getHole(54), getHole(55), getHole(56), getHole(57)], // Inner Row 1 (Top)
          [getHole(46), getHole(47), getHole(48), getHole(49), getHole(50)], // Inner Row 2
          [getHole(39), getHole(40), getHole(41), getHole(42), getHole(43)], // Inner Row 3
          [getHole(32), getHole(33), getHole(34), getHole(35), getHole(36)], // Inner Row 4
          [getHole(26), getHole(27), getHole(0),  getHole(28), getHole(29)], // Inner Row 5 (Box Cut center)
          [getHole(19), getHole(20), getHole(21), getHole(22), getHole(23)], // Inner Row 6 (Bottom)
        ]

        // Perimeter Contour Nodes mapped from Hole Numbers
        const top = [getHole(60), getHole(61), getHole(62), getHole(63), getHole(64)]
        const left = [getHole(59), getHole(52), getHole(45), getHole(38), getHole(31), getHole(25), getHole(18)]
        const right = [getHole(65), getHole(58), getHole(51), getHole(44), getHole(37), getHole(30), getHole(24)]
        const bottom = [getHole(11), getHole(12), getHole(13), getHole(14), getHole(15), getHole(16), getHole(17)]

        return {
          grid,
          perimeter: { top, left, right, bottom },
          boxCut: { outer, inner },
        }
      }

      // Case 2: 2D Grid Matrix Array
      if (Array.isArray(raw[0])) {
        return {
          grid: raw.map((r: any[]) => parseArr(r)),
          perimeter: defaultPerimeter,
          boxCut: defaultBoxCut,
        }
      }
    }

    // Case 3: Structured Object { grid, perimeter, box_cut }
    if (typeof raw === 'object') {
      const rawGrid = raw.grid || raw.grid_delays || defaultGrid
      const grid = Array.isArray(rawGrid)
        ? rawGrid.map((r: any[]) => parseArr(r))
        : defaultGrid

      return {
        grid,
        perimeter: {
          top: parseArr(raw.perimeter?.top || raw.top_delays || defaultPerimeter.top),
          left: parseArr(raw.perimeter?.left || raw.left_delays || defaultPerimeter.left),
          right: parseArr(raw.perimeter?.right || raw.right_delays || defaultPerimeter.right),
          bottom: parseArr(raw.perimeter?.bottom || raw.bottom_delays || defaultPerimeter.bottom),
        },
        boxCut: {
          outer: parseArr(raw.box_cut?.outer || raw.box_cut_delays || defaultBoxCut.outer),
          inner: parseArr(raw.box_cut?.inner || raw.v_cut_delays || defaultBoxCut.inner),
        },
      }
    }

    return { grid: defaultGrid, perimeter: defaultPerimeter, boxCut: defaultBoxCut }
  }, [delayData])

  const { grid, perimeter, boxCut } = parsedData

  return (
    <div className="w-full bg-gradient-to-br from-[#120418] via-[#090a12] to-[#041214] text-white p-4 sm:p-8 rounded-3xl border border-gray-800 shadow-2xl overflow-x-auto select-none font-sans">
      
      {/* Header bar */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-800/80">
        <div>
          <span className="text-[10px] font-black tracking-widest text-[#FFF000] uppercase bg-black/60 px-3 py-1 rounded-md border border-yellow-500/30">
            📊 DATA REALTIME UNREAL ENGINE
          </span>
          <h3 className="text-xl font-bold text-white mt-1">
            {title || 'Diagram Setting Delay Peledakan Tambang Bawah Tanah'}
          </h3>
        </div>
        <div className="hidden sm:flex items-center space-x-2 text-xs text-gray-400 font-mono">
          <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></span>
          <span>Array Data Synced</span>
        </div>
      </div>

      {/* Main Diagram Content: Left Tunnel Face + Right Box Cut Zoom */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        
        {/* LEFT PANEL: Tunnel Arch Cross-Section Profile (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center relative p-2 min-w-[340px]">
          
          {/* Tunnel Canvas Container */}
          <div className="relative w-full max-w-[440px] aspect-[5/5.5] flex items-center justify-center p-2 bg-gray-950/40 rounded-3xl border border-gray-800/40 shadow-2xl">
            <svg viewBox="0 0 500 540" className="w-full h-full select-none overflow-visible">
              
              {/* Outer Thick Tunnel Arch Line */}
              <path
                d="M 120 50 Q 50 50 50 120 L 50 490 L 450 490 L 450 120 Q 450 50 380 50 Z"
                fill="none"
                stroke="#E5E7EB"
                strokeWidth="6"
                strokeLinejoin="round"
                filter="drop-shadow(0px 0px 8px rgba(255,255,255,0.15))"
              />

              {/* PERIMETER NODES & LABELS */}

              {/* Top Roof (5 Nodes) */}
              {[120, 185, 250, 315, 380].map((x, idx) => (
                <g key={`p-top-${idx}`}>
                  <text x={x} y="32" fill="white" fontSize="12" fontWeight="bold" fontFamily="monospace" textAnchor="middle">{perimeter.top[idx] ?? 0} ms</text>
                  <circle cx={x} cy="50" r="6" fill="white" stroke="#000" strokeWidth="1.5" />
                </g>
              ))}

              {/* Top-Left Curve Node */}
              <text x="42" y="60" fill="white" fontSize="12" fontWeight="bold" fontFamily="monospace" textAnchor="end">{perimeter.left[0] ?? 0} ms</text>
              <circle cx="68" cy="68" r="6" fill="white" stroke="#000" strokeWidth="1.5" />

              {/* Top-Right Curve Node */}
              <text x="458" y="60" fill="white" fontSize="12" fontWeight="bold" fontFamily="monospace" textAnchor="start">{perimeter.right[0] ?? 0} ms</text>
              <circle cx="432" cy="68" r="6" fill="white" stroke="#000" strokeWidth="1.5" />

              {/* Left Wall Nodes (6 Nodes: Holes 52, 45, 38, 31, 25, 18) */}
              {[135, 195, 255, 315, 375, 435].map((y, idx) => (
                <g key={`p-left-${idx}`}>
                  <text x="35" y={y + 4} fill="white" fontSize="12" fontWeight="bold" fontFamily="monospace" textAnchor="end">{perimeter.left[idx + 1] ?? 0} ms</text>
                  <circle cx="50" cy={y} r="6" fill="white" stroke="#000" strokeWidth="1.5" />
                </g>
              ))}

              {/* Right Wall Nodes (6 Nodes: Holes 58, 51, 44, 37, 30, 24) */}
              {[135, 195, 255, 315, 375, 435].map((y, idx) => (
                <g key={`p-right-${idx}`}>
                  <text x="465" y={y + 4} fill="white" fontSize="12" fontWeight="bold" fontFamily="monospace" textAnchor="start">{perimeter.right[idx + 1] ?? 0} ms</text>
                  <circle cx="450" cy={y} r="6" fill="white" stroke="#000" strokeWidth="1.5" />
                </g>
              ))}

              {/* Bottom Floor Nodes (7 Nodes) */}
              {[50, 116, 183, 250, 316, 383, 450].map((x, idx) => (
                <g key={`p-bot-${idx}`}>
                  <circle cx={x} cy="490" r="6" fill="white" stroke="#000" strokeWidth="1.5" />
                  <text x={x} y="515" fill="white" fontSize="12" fontWeight="bold" fontFamily="monospace" textAnchor="middle">{perimeter.bottom[idx] ?? 0} ms</text>
                </g>
              ))}

              {/* INNER BLAST HOLE GRID (5 Cols x 6 Rows) */}

              {/* Row 1 (y=120) - Labels ABOVE */}
              {[130, 190, 250, 310, 370].map((x, cIdx) => (
                <g key={`r1-${cIdx}`}>
                  <text x={x} y="105" fill="white" fontSize="11" fontWeight="bold" fontFamily="monospace" textAnchor="middle">{grid[0]?.[cIdx] ?? 0} ms</text>
                  <circle cx={x} cy="120" r="5" fill="white" stroke="#000" strokeWidth="1" />
                </g>
              ))}

              {/* Row 2 (y=190) - Labels BELOW */}
              {[130, 190, 250, 310, 370].map((x, cIdx) => (
                <g key={`r2-${cIdx}`}>
                  <circle cx={x} cy="190" r="5" fill="white" stroke="#000" strokeWidth="1" />
                  <text x={x} y="210" fill="white" fontSize="11" fontWeight="bold" fontFamily="monospace" textAnchor="middle">{grid[1]?.[cIdx] ?? 0} ms</text>
                </g>
              ))}

              {/* Row 3 (y=260) - Labels BELOW */}
              {[130, 190, 250, 310, 370].map((x, cIdx) => (
                <g key={`r3-${cIdx}`}>
                  <circle cx={x} cy="260" r="5" fill="white" stroke="#000" strokeWidth="1" />
                  <text x={x} y="280" fill="white" fontSize="11" fontWeight="bold" fontFamily="monospace" textAnchor="middle">{grid[2]?.[cIdx] ?? 0} ms</text>
                </g>
              ))}

              {/* Row 4 (y=330) - Labels BELOW */}
              {[130, 190, 250, 310, 370].map((x, cIdx) => (
                <g key={`r4-${cIdx}`}>
                  <circle cx={x} cy="330" r="5" fill="white" stroke="#000" strokeWidth="1" />
                  <text x={x} y="350" fill="white" fontSize="11" fontWeight="bold" fontFamily="monospace" textAnchor="middle">{grid[3]?.[cIdx] ?? 0} ms</text>
                </g>
              ))}

              {/* Row 5 (y=400) - Col 1, 2, 4, 5 (Col 3 is Box Cut) */}
              {[130, 190, 310, 370].map((x, idx) => {
                const cIdx = x < 250 ? (x === 130 ? 0 : 1) : (x === 310 ? 3 : 4)
                return (
                  <g key={`r5-${idx}`}>
                    <circle cx={x} cy="400" r="5" fill="white" stroke="#000" strokeWidth="1" />
                    <text x={x} y="420" fill="white" fontSize="11" fontWeight="bold" fontFamily="monospace" textAnchor="middle">{grid[4]?.[cIdx] ?? 0} ms</text>
                  </g>
                )
              })}

              {/* Row 6 (y=455) - Labels BELOW */}
              {[130, 190, 250, 310, 370].map((x, cIdx) => (
                <g key={`r6-${cIdx}`}>
                  <circle cx={x} cy="455" r="5" fill="white" stroke="#000" strokeWidth="1" />
                  <text x={x} y="475" fill="white" fontSize="11" fontWeight="bold" fontFamily="monospace" textAnchor="middle">{grid[5]?.[cIdx] ?? 0} ms</text>
                </g>
              ))}

              {/* OVERLAY BOX CUT AT ROW 5 CENTER (x=250, y=400) */}
              <g id="box-cut-overlay">
                {/* Dashed Square Bounding Box */}
                <rect x="215" y="365" width="70" height="70" fill="none" stroke="white" strokeWidth="2.5" strokeDasharray="5 4" rx="2" />
                
                {/* Outer 8 Nodes on Dashed Square */}
                <circle cx="215" cy="365" r="4" fill="white" />
                <circle cx="250" cy="365" r="4" fill="white" />
                <circle cx="285" cy="365" r="4" fill="white" />
                <circle cx="215" cy="400" r="4" fill="white" />
                <circle cx="285" cy="400" r="4" fill="white" />
                <circle cx="215" cy="435" r="4" fill="white" />
                <circle cx="250" cy="435" r="4" fill="white" />
                <circle cx="285" cy="435" r="4" fill="white" />

                {/* V-Cut Dashed Lines */}
                <line x1="250" y1="385" x2="233" y2="420" stroke="white" strokeWidth="2" strokeDasharray="4 3" />
                <line x1="250" y1="385" x2="267" y2="420" stroke="white" strokeWidth="2" strokeDasharray="4 3" />

                {/* Inner Yellow & White Nodes */}
                <circle cx="250" cy="385" r="5.5" fill="#FFFF00" stroke="#FFF000" strokeWidth="1" />
                <circle cx="250" cy="420" r="3.5" fill="white" />
                <circle cx="233" cy="420" r="5.5" fill="#FFFF00" stroke="#FFF000" strokeWidth="1" />
                <circle cx="267" cy="420" r="5.5" fill="#FFFF00" stroke="#FFF000" strokeWidth="1" />
              </g>

            </svg>
          </div>
        </div>

        {/* RIGHT PANEL: DELAY BOX CUT Zoomed Detail View (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center p-6 bg-black/40 rounded-3xl border border-gray-800/80">
          
          <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-widest mb-6 font-sans drop-shadow-md text-center">
            DELAY BOX CUT
          </h2>

          {/* SVG Rendered Box Cut Diagram - Exact 1:1 Match with Reference */}
          <div className="relative w-[280px] h-[280px] sm:w-[320px] sm:h-[320px] flex items-center justify-center p-2 bg-gray-950/60 rounded-2xl border border-gray-800/50 shadow-2xl">
            <svg viewBox="0 0 300 300" className="w-full h-full select-none overflow-visible">
              
              {/* Outer Bounding Dashed Square */}
              <rect
                x="50"
                y="50"
                width="200"
                height="200"
                fill="none"
                stroke="white"
                strokeWidth="3.5"
                strokeDasharray="10 8"
                rx="4"
              />

              {/* Dashed V-Cut Inverted V Lines connecting Apex Yellow to Base Yellows */}
              <line
                x1="150"
                y1="100"
                x2="105"
                y2="205"
                stroke="white"
                strokeWidth="3.5"
                strokeDasharray="8 6"
              />
              <line
                x1="150"
                y1="100"
                x2="195"
                y2="205"
                stroke="white"
                strokeWidth="3.5"
                strokeDasharray="8 6"
              />

              {/* OUTER PERIMETER NODES & LABELS */}
              
              {/* Top Row (3 Nodes) */}
              {/* Top-Left */}
              <text x="50" y="32" fill="white" fontSize="13" fontWeight="bold" fontFamily="monospace" textAnchor="middle">{boxCut.outer[0] ?? 0} ms</text>
              <circle cx="50" cy="50" r="9" fill="white" stroke="#000" strokeWidth="1.5" />

              {/* Top-Center */}
              <text x="150" y="32" fill="white" fontSize="13" fontWeight="bold" fontFamily="monospace" textAnchor="middle">{boxCut.outer[1] ?? 0} ms</text>
              <circle cx="150" cy="50" r="9" fill="white" stroke="#000" strokeWidth="1.5" />

              {/* Top-Right */}
              <text x="250" y="32" fill="white" fontSize="13" fontWeight="bold" fontFamily="monospace" textAnchor="middle">{boxCut.outer[2] ?? 0} ms</text>
              <circle cx="250" cy="50" r="9" fill="white" stroke="#000" strokeWidth="1.5" />

              {/* Middle Side Nodes (2 Nodes) */}
              {/* Left-Center */}
              <text x="32" y="154" fill="white" fontSize="13" fontWeight="bold" fontFamily="monospace" textAnchor="end">{boxCut.outer[7] ?? 0} ms</text>
              <circle cx="50" cy="150" r="9" fill="white" stroke="#000" strokeWidth="1.5" />

              {/* Right-Center */}
              <text x="268" y="154" fill="white" fontSize="13" fontWeight="bold" fontFamily="monospace" textAnchor="start">{boxCut.outer[3] ?? 0} ms</text>
              <circle cx="250" cy="150" r="9" fill="white" stroke="#000" strokeWidth="1.5" />

              {/* Bottom Row (3 Nodes) */}
              {/* Bottom-Left */}
              <circle cx="50" cy="250" r="9" fill="white" stroke="#000" strokeWidth="1.5" />
              <text x="50" y="275" fill="white" fontSize="13" fontWeight="bold" fontFamily="monospace" textAnchor="middle">{boxCut.outer[6] ?? 0} ms</text>

              {/* Bottom-Center */}
              <circle cx="150" cy="250" r="9" fill="white" stroke="#000" strokeWidth="1.5" />
              <text x="150" y="275" fill="white" fontSize="13" fontWeight="bold" fontFamily="monospace" textAnchor="middle">{boxCut.outer[5] ?? 0} ms</text>

              {/* Bottom-Right */}
              <circle cx="250" cy="250" r="9" fill="white" stroke="#000" strokeWidth="1.5" />
              <text x="250" y="275" fill="white" fontSize="13" fontWeight="bold" fontFamily="monospace" textAnchor="middle">{boxCut.outer[4] ?? 0} ms</text>

              {/* INNER V-CUT NODES & LABELS */}
              
              {/* Inner Row 1: Apex Yellow Node (No Text Data) */}
              <circle cx="150" cy="100" r="10" fill="#FFFF00" stroke="#FFF000" strokeWidth="2" filter="drop-shadow(0px 0px 6px #FFFF00)" />

              {/* Inner Row 1: Top-Left White */}
              <circle cx="105" cy="100" r="7.5" fill="white" stroke="#000" strokeWidth="1.5" />
              <text x="105" y="122" fill="white" fontSize="12" fontWeight="bold" fontFamily="monospace" textAnchor="middle">{boxCut.inner[1] ?? 0} ms</text>

              {/* Inner Row 1: Top-Right White */}
              <circle cx="195" cy="100" r="7.5" fill="white" stroke="#000" strokeWidth="1.5" />
              <text x="195" y="122" fill="white" fontSize="12" fontWeight="bold" fontFamily="monospace" textAnchor="middle">{boxCut.inner[2] ?? 0} ms</text>

              {/* Inner Row 2: Center White Node */}
              <text x="150" y="174" fill="white" fontSize="12" fontWeight="bold" fontFamily="monospace" textAnchor="middle">{boxCut.inner[3] ?? 0} ms</text>
              <circle cx="150" cy="190" r="7.5" fill="white" stroke="#000" strokeWidth="1.5" />

              {/* Inner Row 3: Left Base Yellow Node (No Text Data) */}
              <circle cx="105" cy="205" r="10" fill="#FFFF00" stroke="#FFF000" strokeWidth="2" filter="drop-shadow(0px 0px 6px #FFFF00)" />

              {/* Inner Row 3: Right Base Yellow Node (No Text Data) */}
              <circle cx="195" cy="205" r="10" fill="#FFFF00" stroke="#FFF000" strokeWidth="2" filter="drop-shadow(0px 0px 6px #FFFF00)" />

            </svg>
          </div>

          <div className="mt-6 text-center text-xs text-gray-400 space-y-1">
            <p className="font-semibold text-[#FFF000]">🟡 Formasi Segitiga V-Cut (Initial Box Cut)</p>
            <p>Node Kuning Terhubung Garis Putus-Putus</p>
          </div>
        </div>

      </div>
    </div>
  )
})
