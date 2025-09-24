// Check if rectangle a contains rectangle b
// Each object (a and b) should have 2 properties to represent the
// top-left corner (x1, y1) and 2 for the bottom-right corner (x2, y2).
export function contains(a: { x1: number; y1: number; x2: number; y2: number }, b: { x1: number; y1: number; x2: number; y2: number }) {
	return !(
		b.x1 < a.x1 ||
		b.y1 < a.y1 ||
		b.x2 > a.x2 ||
		b.y2 > a.y2
	);
}

// Check if rectangle a overlaps rectangle b
// Each object (a and b) should have 2 properties to represent the
// top-left corner (x1, y1) and 2 for the bottom-right corner (x2, y2).
export function overlaps(a: { x1: number; y1: number; x2: number; y2: number }, b: { x1: number; y1: number; x2: number; y2: number }) {
	// no horizontal overlap
	if (a.x1 >= b.x2 || b.x1 >= a.x2) return false;

	// no vertical overlap
	if (a.y1 >= b.y2 || b.y1 >= a.y2) return false;

	return true;
}

// Check if rectangle a touches rectangle b
// Each object (a and b) should have 2 properties to represent the
// top-left corner (x1, y1) and 2 for the bottom-right corner (x2, y2).
export function touches(a: { x1: number; y1: number; x2: number; y2: number }, b: { x1: number; y1: number; x2: number; y2: number }) {
	// has horizontal gap
	if (a.x1 > b.x2 || b.x1 > a.x2) return false;

	// has vertical gap
	if (a.y1 > b.y2 || b.y1 > a.y2) return false;

	return true;
}



export class GeometryUtils
{
    public static Distance(point:{x:number, y:number}, rect:{left:number, top:number, width:number, height:number})
    {
        var xDist = this.MinXDistance(point, rect);
        var yDist = this.MinYDistance(point, rect);
        if (xDist == 0)
        {
            return yDist;
        }
        else if (yDist == 0)
        {
            return xDist;
        }

        return Math.sqrt(Math.pow(xDist, 2) + Math.pow(yDist, 2));
    }

    private static MinXDistance(point:{x:number, y:number}, rect:{left:number, top:number, width:number, height:number})
    {
        if (rect.left > point.x)
        {
            return rect.left - point.x;
        }
        else if (rect.left + rect.width < point.x)
        {
            return point.x - (rect.left + rect.width);
        }
        else
        {
            return 0;
        }
    }

    private static MinYDistance(point:{x:number, y:number}, rect:{left:number, top:number, width:number, height:number})
    {
        if (rect.top + rect.height < point.y)
        {
            return point.y - (rect.top + rect.height);
        }
        else if (rect.top > point.y)
        {
            return rect.top - point.y;
        }
        else
        {
            return 0;
        }
    }
}