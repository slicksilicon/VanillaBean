import { useState, useEffect } from "react";

type ImageModule = {
  default: string;
};

// 1. Import all files ending in splash*.png 
// 'eager: true' imports them directly rather than as dynamic promises
const modules = import.meta.glob<ImageModule>('../assets/Splash*.png', { eager: true });

import "./Splash.css";

// 2. Convert the object to an array of image paths
// Vite returns an object where keys are paths and values are the modules
const splashImages = Object.values(modules).map((mod : ImageModule) => mod.default);

const Splash: React.FC = () => {
    const [selectedImage, setSelectedImage] = useState<string>("");

    useEffect(() => {
        // Randomly select an image when component mounts
        const randomIndex = Math.floor(Math.random() * splashImages.length);
        setSelectedImage(splashImages[randomIndex]);
    }, []);

    if (!selectedImage) {
        return null; // or a loading spinner
    }

    return (
        <div className="home-container">
            <img src={selectedImage} alt="Home" className="home-image" />
            <div className="copyright-text">Copyright © Slick Silicon 2025</div>
        </div>
    );
};

export default Splash;
