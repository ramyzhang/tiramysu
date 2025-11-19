import { Vector2 } from "three"; 

export function updatePointerPosition(event: PointerEvent): Vector2 {
    return new Vector2(
        (event.clientX / window.innerWidth) * 2 - 1,
        -((event.clientY / window.innerHeight) * 2 - 1)
    );
}