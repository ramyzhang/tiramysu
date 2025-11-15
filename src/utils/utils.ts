export function updatePointerPosition(event: PointerEvent): { pointerX: number, pointerY: number } {
    // Calculate pointer position in normalized device coordinates (-1 to +1)
    const pointerX = (event.clientX / window.innerWidth) * 2 - 1;
    const pointerY = (event.clientY / window.innerHeight) * 2 - 1;
    return { pointerX, pointerY };
}