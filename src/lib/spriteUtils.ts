// This function takes the uploaded images and combines them into a single sprite sheet for Canvas.
export const createGoblinSpriteSheet = async (imageFiles: string[]): Promise<HTMLImageElement> => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to create canvas');

    const frameWidth = 32;
    const frameHeight = 32;
    canvas.width = Math.max(frameWidth, frameWidth * imageFiles.length);
    canvas.height = frameHeight;

    const loadImages = imageFiles.map((src, index) => {
        return new Promise<void>((resolve) => {
            const img = new Image();
            img.onload = () => {
                ctx.drawImage(img, index * frameWidth, 0, frameWidth, frameHeight);
                resolve();
            };
            img.onerror = () => {
                console.warn(`Failed to load sprite frame: ${src}`);
                resolve();
            };
            img.src = src;
        });
    });

    await Promise.all(loadImages);

    return new Promise((resolve) => {
        const spriteSheet = new Image();
        spriteSheet.onload = () => resolve(spriteSheet);
        spriteSheet.onerror = () => resolve(spriteSheet);
        spriteSheet.src = canvas.toDataURL();
    });
};

export const loadFrameImages = async (sources: string[]): Promise<HTMLImageElement[]> => {
    return Promise.all(
        sources.map((src) => {
            return new Promise<HTMLImageElement>((resolve) => {
                const img = new Image();
                img.onload = () => resolve(img);
                img.onerror = () => {
                    console.warn(`Failed to load frame image: ${src}`);
                    resolve(img);
                };
                img.src = src;
            });
        })
    );
};

