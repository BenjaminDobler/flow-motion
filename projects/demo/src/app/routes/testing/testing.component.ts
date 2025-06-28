import { Component, effect, signal, viewChild } from '@angular/core'
import { NgBondProperty } from '../../lib/ngbond/components/ng-bond-property/ng-bond-property'
import { NgBondContainer } from '../../lib/ngbond/components/ng-bond-container/ng-bond-container'

type Rect = { x: number; y: number; height: number; width: number }
type Point = { x: number; y: number; adjacent?: Point[] }
type Line = { from: Point; to: Point }

export const getDistance = (p1: Point, p2: Point) => {
    const { x: x1, y: y1 } = p1
    const { x: x2, y: y2 } = p2
    const y = x2 - x1
    const x = y2 - y1
    return Math.sqrt(x * x + y * y)
}

const key = (point: Point) => {
    return point.x + '_' + point.y
}

const clonePoint = (p: Point): Point => {
    return {
        x: p.x,
        y: p.y,
        adjacent: p.adjacent,
    }
}

const getAllXYValues = (rect: Rect) => {
    const allX = []
    allX.push(rect.x)
    allX.push(rect.x + rect.width)
    allX.push(rect.x + rect.width / 2)

    const allY = []
    allY.push(rect.y)
    allY.push(rect.y + rect.height)
    allY.push(rect.y + rect.height / 2)

    return [allX, allY]
}

const expandRect = (rect: Rect, margin: number) => {
    const r: Rect = {
        x: rect.x - margin / 2,
        y: rect.y - margin / 2,
        height: rect.height + margin,
        width: rect.width + margin,
    }
    return r
}

const rectToPointArray = (rect: Rect) => {
    const points: Point[] = []

    // draw edges
    points.push({ x: rect.x, y: rect.y })
    points.push({ x: rect.x + rect.width, y: rect.y })
    points.push({
        x: rect.x + rect.width,
        y: rect.y + rect.height,
    })
    points.push({ x: rect.x, y: rect.y + rect.height })

    // draw middle points
    points.push({ x: rect.x + rect.width / 2, y: rect.y })
    points.push({ x: rect.x, y: rect.y + rect.height / 2 })
    points.push({ x: rect.x + rect.width, y: rect.y + rect.height / 2 })
    points.push({ x: rect.x + rect.width / 2, y: rect.y + rect.height })

    return points
}

@Component({
    selector: 'app-testing',
    imports: [NgBondContainer],
    templateUrl: './testing.component.html',
    styleUrl: './testing.component.scss',
})
export class TestingComponent {
    p1 = viewChild<NgBondContainer>('p1')
    p2 = viewChild<NgBondContainer>('p2')
    rectMargin = signal(50)
    protected points = signal<Point[]>([])
    protected horizontalLines = signal<Line[]>([])
    protected verticalLines = signal<Line[]>([])
    protected activePoint?: Point
    protected startPoint?: Point
    protected endPoint?: Point

    resultPath = signal('');

    pointMap: Map<string, Point> = new Map<string, Point>()

    constructor() {
        effect(() => {
            const rect1 = {
                x: this.p1()?.gX() || 0,
                y: this.p1()?.gY() || 0,
                width: this.p1()?.width() || 0,
                height: this.p1()?.height() || 0,
            }

            const rect2 = {
                x: this.p2()?.gX() || 0,
                y: this.p2()?.gY() || 0,
                width: this.p2()?.width() || 0,
                height: this.p2()?.height() || 0,
            }

            console.log('same? ', this.p1() === this.p2())

            this.rectsChanged(rect1, rect2, this.rectMargin())
        })
    }

    rectsChanged(r1: Rect, r2: Rect, rectMargin: number) {
        console.log('rects changed ', rectMargin)
        const outerRect1 = expandRect(r1, rectMargin)
        const outerRect2 = expandRect(r2, rectMargin)

        const [xs1, ys1] = getAllXYValues(outerRect1)
        const [xs2, ys2] = getAllXYValues(outerRect2)
        const allX = [...xs1, ...xs2]
        const allY = [...ys1, ...ys2]

        let allPoints: Point[] = []

        const xMin = Math.min(outerRect1.x, outerRect2.x)
        const xMax = Math.max(outerRect1.x + outerRect1.width, outerRect2.x + outerRect2.width)

        const yMin = Math.min(outerRect1.y, outerRect2.y)
        const yMax = Math.max(outerRect1.y + outerRect1.height, outerRect2.y + outerRect2.height)

        allX.push(xMin + (xMax - xMin) / 2)
        allY.push(yMin + (yMax - yMin) / 2)

        for (let x = 0; x < allX.length; x++) {
            for (let y = 0; y < allY.length; y++) {
                allPoints.push({ x: allX[x], y: allY[y] })
            }
        }

        // draw points between rects

        const allXMinPoints = allPoints.filter((p) => p.x === xMin)
        const horizontalLines = allXMinPoints.map((p) => ({
            from: { x: xMin, y: p.y },
            to: { x: xMax, y: p.y },
        }))

        const allXMaxPoints = allPoints.filter((p) => p.x === xMax)
        const horizontalLines2 = allXMaxPoints.map((p) => ({
            from: { x: xMin, y: p.y },
            to: { x: xMax, y: p.y },
        }))
        this.horizontalLines.set([...horizontalLines, ...horizontalLines2])

        const allYLines = allPoints.filter((p) => p.y === yMin || p.y === yMax)
        const verticalLines = allYLines.map((p) => ({
            from: { x: p.x, y: yMin },
            to: { x: p.x, y: yMax },
        }))
        this.verticalLines.set(verticalLines)

        allPoints.sort((a, b) => {
            return a.y - b.y
        })

        let sortedPoints: Point[] = []
        for (let y = 0; y < 7; y++) {
            const row = allPoints.slice(y * 7, y * 7 + 7)
            row.sort((a, b) => {
                return a.x - b.x
            })
            sortedPoints = [...sortedPoints, ...row]
        }

        allPoints = sortedPoints
        console.log('all points')
        console.log(allPoints)

        // const uniquePoints = allPoints.reduce<Point[]>((acc, curr) => {
        //   const existing = acc.find((p) => p.x === curr.x && p.y === curr.y);
        //   if (!existing) {
        //     acc.push(curr);
        //   }
        //   return acc;
        // }, []);
        // console.log('unique points');
        // console.log(uniquePoints);

        const uniquePoints = allPoints

        const rows = []

        this.pointMap = new Map()

        for (let y = 0; y < 7; y++) {
            const col: Point[] = []
            rows.push(col)
            for (let x = 0; x < 7; x++) {
                const index = y * 7 + x
                const p = uniquePoints[index]
                this.pointMap.set(key(p), p)

                if (!p.adjacent) {
                    p.adjacent = []
                }
                if (x > 0) {
                    p.adjacent.push(uniquePoints[index - 1])
                }
                if (x < 7 - 1) {
                    p.adjacent.push(uniquePoints[index + 1])
                }
                if (y > 0) {
                    p.adjacent.push(uniquePoints[index - 7])
                }
                if (y < 7 - 1) {
                    p.adjacent.push(uniquePoints[index + 7])
                }
                col.push(p)
            }
        }
        this.points.set(uniquePoints)
    }

    startFromNode(startNode: Point | undefined) {
        if (!startNode) {
            return
        }
        // visit points neigbours
        const visited: Map<string, Point> = new Map<string, Point>()
        const unvisited: Map<string, Point> = this.pointMap
        const shortestDistances = new Map<string, { previous?: Point; distance: number }>()
        this.pointMap.forEach((p, key) => {
            shortestDistances.set(key, { distance: Number.POSITIVE_INFINITY })
        })

        let setCount = 0
        shortestDistances.set(key(startNode), { distance: 0 })
        visited.set(key(startNode), startNode)
        unvisited.delete(key(startNode))

        let current = startNode

        console.log('entries ', unvisited.entries.length)
        while (unvisited.size > 0) {
            console.log('do ', unvisited.size)
            let pointWithSmallestDist!: Point | null

            let smallestDist = Number.POSITIVE_INFINITY
            const currentDistEntry = shortestDistances.get(key(current))

            let currentDistance = 0
            if (currentDistEntry) {
                currentDistance = currentDistEntry.distance
            } else {
                throw Error('no distance for ' + key(current))
            }
            console.log('current distance ', currentDistance)
            current.adjacent?.forEach((adjacentPoint) => {
                if (!visited.has(key(adjacentPoint))) {
                    console.log('yup')
                    const adjacentDistance = getDistance(current, adjacentPoint)
                    const dist = currentDistance + adjacentDistance
                    const existingSmallestDistPoint = shortestDistances.get(key(adjacentPoint))

                    if (!existingSmallestDistPoint || existingSmallestDistPoint.distance > dist) {
                        shortestDistances.set(key(adjacentPoint), { distance: dist, previous: current })
                    }
                    console.log(dist, smallestDist)
                    if (dist < smallestDist) {
                        smallestDist = dist
                        pointWithSmallestDist = adjacentPoint
                        console.log('point with smallest ', key(adjacentPoint))
                    }
                } else {
                    console.log('has already been visited!')
                }
            })
            visited.set(key(current), current)
            unvisited.delete(key(current))
            console.log('delete ', key(current))
            if (!pointWithSmallestDist) {
              console.log('What now? All adjatents have already been visited!?');
              const next = unvisited.values().next().value;
              if (next) {
                current = next;
              } else {
                console.log('no next');
              }
            } else {
                current = pointWithSmallestDist as Point
            }
        }

        shortestDistances.forEach((a, k) => {
            if (a && a.previous) {
                console.log(k, key(a.previous), a.distance)
            } else {
                console.log(k, a)
            }
        })

        // const visitPoint = (point: Point) => {
        //     visited.set(key(point), point)
        //     unvisited.delete(key(point))

        //     let smallestDist = Number.POSITIVE_INFINITY
        //     let pointWithSmallestDist: Point = point
        //     point.adjacent?.forEach((adjacentPoint) => {
        //         if (!visited.has(key(adjacentPoint))) {
        //             const dist = getDistance(point, adjacentPoint)
        //             const existingSmallestDistPoint = shortestDistances.get(key(adjacentPoint))
        //             if (!existingSmallestDistPoint || existingSmallestDistPoint.distance > dist) {
        //                 shortestDistances.set(key(adjacentPoint), { distance: dist, previous: point })
        //             }
        //             if (dist < smallestDist) {
        //                 smallestDist = dist
        //                 pointWithSmallestDist = adjacentPoint
        //             }
        //         } else {
        //           console.log('has already been visited!');
        //         }
        //     })

        //     // console.log('key ', key(pointWithSmallestDist))
        //     // const existingSmallestDistPoint = shortestDistances.get(key(pointWithSmallestDist))
        //     // if (!existingSmallestDistPoint || existingSmallestDistPoint.distance < smallestDist) {
        //     //     console.log('set ', smallestDist, point)
        //     //     setCount++
        //     //     shortestDistances.set(key(pointWithSmallestDist), { distance: smallestDist, previous: point })
        //     // }

        //     const next = pointWithSmallestDist //unvisited.entries().next().value

        //     if (unvisited.entries.length > 0) {
        //         visitPoint(next)
        //     }
        //     return shortestDistances
        // }

        // visitPoint(startNode)

        // console.log('all visited! ', setCount)

        // shortestDistances.forEach((a, k) => {
        //     if (a && a.previous) {
        //         console.log(k, key(a.previous), a.distance)
        //     } else {
        //         console.log(k, a)
        //     }
        // })

        let resultPath = ''
        if (this.endPoint) {
            let currentP: Point | undefined = this.endPoint
            resultPath = `M ${currentP.x} ${currentP.y}`
            while (currentP && currentP !== this.startPoint) {
                const p = shortestDistances.get(key(currentP))
                console.log('p ', p)
                currentP = p?.previous
                if (currentP) {
                    console.log(currentP)
                    resultPath += `L ${currentP.x} ${currentP.y}`
                }
            }
        }
        console.log(resultPath)

        this.resultPath.set(resultPath);
    }

    updateMargin(m: number) {
        this.rectMargin.set(m)
    }

    setActivePoint(p: Point) {
        if (this.activePoint === p) {
            this.activePoint = undefined
        } else {
            this.activePoint = p
        }
    }

    setStartPoint(p: Point) {
        this.startPoint = p;//clonePoint(p)
    }

    setEndPoint(p: Point) {
        this.endPoint = p;//clonePoint(p)
    }
}
