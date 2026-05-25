// src/components/ui/GlowButton.tsx

import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import "./GlowButton.css";

interface Props {
  children?: React.ReactNode;
  onClick?: () => void;
}

export default function GlowButton({
  children,
  onClick,
}: Props) {
  return (
    <motion.button
      whileHover={{
        scale: 1.03,
      }}
      whileTap={{
        scale: 0.97,
      }}
      onClick={onClick}
      className="glow-btn"
    >
      {/* SUN AURA */}
      <div className="glow-sun" />

      {/* SPARKLES */}
      <span className="spark spark-1" />
      <span className="spark spark-2" />
      <span className="spark spark-3" />
      <span className="spark spark-4" />
      <span className="spark spark-5" />

      {/* CONTENT */}
      <div className="glow-content">
        <Plus size={18} />
        <span>{children || "New Task"}</span>
      </div>
    </motion.button>
  );
}