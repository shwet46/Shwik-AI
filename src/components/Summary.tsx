"use client";
import { useState } from "react";
import { Copy, Download, ArrowLeft } from "lucide-react";
import { saveAs } from "file-saver";
import { motion } from "framer-motion";

interface SummaryOutputProps {
  summary: string;
  sourceType: string;
  fileName?: string;
  onGoBack: () => void;
}

export default function Summary({ 
  summary, 
  sourceType,
  fileName,
  onGoBack 
}: SummaryOutputProps) {
  const [copySuccess, setCopySuccess] = useState(false);

  const handleCopy = () => {
    if (summary) {
      navigator.clipboard.writeText(summary);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  const handleDownload = () => {
    if (summary) {
      const blob = new Blob([summary], { type: "text/plain" });
      const filename =
        sourceType === "text"
          ? `text-summary-${new Date().toISOString().slice(0, 10)}.txt`
          : `summary-${fileName?.split(".")[0] || "document"}-${new Date().toISOString().slice(0, 10)}.txt`;

      saveAs(blob, filename);
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        type: "spring",
        damping: 25,
        stiffness: 100,
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    },
    exit: { 
      opacity: 0, 
      y: -20, 
      transition: { duration: 0.3 } 
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { type: "spring", damping: 20 }
    }
  };

  const buttonVariants = {
    hover: { scale: 1.05 },
    tap: { scale: 0.95 }
  };

  return (
    <motion.div
      className="w-full"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      <motion.div className="flex items-center gap-3 mb-6" variants={itemVariants}>
        <motion.button
          onClick={onGoBack}
          className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
          whileHover="hover"
          whileTap="tap"
          variants={buttonVariants}
        >
          <ArrowLeft size={20} />
        </motion.button>
        <h2 className="text-xl font-medium text-gray-800">
          Summary Result
        </h2>
      </motion.div>

      <motion.div 
        className="bg-amber-50 rounded-lg border border-amber-200 p-6 mb-4"
        variants={itemVariants}
      >
        {/* Source info */}
        <motion.div className="mb-3 flex items-center" variants={itemVariants}>
          <span className="text-xs font-medium px-2 py-1 rounded-full bg-amber-100 text-amber-800">
            {sourceType === "text" ? "Text Input" : `File: ${fileName}`}
          </span>
        </motion.div>

        {/* Actions */}
        <motion.div className="flex justify-end gap-2 mb-4" variants={itemVariants}>
          <motion.button
            onClick={handleCopy}
            className="px-3 py-1.5 bg-gray-200 rounded-full hover:bg-gray-300 transition-colors flex items-center gap-1.5 text-sm"
            whileHover="hover"
            whileTap="tap"
            variants={buttonVariants}
          >
            <Copy size={16} />
            {copySuccess ? "Copied!" : "Copy"}
          </motion.button>
          <motion.button
            onClick={handleDownload}
            className="px-3 py-1.5 bg-gray-200 rounded-full hover:bg-gray-300 transition-colors flex items-center gap-1.5 text-sm"
            whileHover="hover"
            whileTap="tap"
            variants={buttonVariants}
          >
            <Download size={16} />
            Download
          </motion.button>
        </motion.div>

        {/* Summary content */}
        <motion.div 
          className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm whitespace-pre-wrap"
          variants={itemVariants}
          initial={{ opacity: 0, y: 10 }}
          animate={{ 
            opacity: 1, 
            y: 0,
            transition: { 
              type: "spring",
              delay: 0.2,
              damping: 20 
            }
          }}
        >
          {summary}
        </motion.div>
      </motion.div>

      <motion.div className="flex justify-center" variants={itemVariants}>
        <motion.button
          onClick={onGoBack}
          className="px-4 py-2 bg-purple-100 text-purple-800 rounded-md hover:bg-purple-200 transition-colors flex items-center gap-2"
          whileHover="hover"
          whileTap="tap"
          variants={buttonVariants}
        >
          <ArrowLeft size={16} />
          Back to Input
        </motion.button>
      </motion.div>
    </motion.div>
  );
}