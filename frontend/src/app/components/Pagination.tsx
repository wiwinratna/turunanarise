import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ThemeConfig } from "./AppContext";

interface PaginationProps {
  currentPage: number;
  lastPage: number;
  total: number;
  perPage: number;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
  theme: ThemeConfig;
}

export function Pagination({ currentPage, lastPage, total, perPage, onPageChange, onPerPageChange, theme }: PaginationProps) {
  const isFirstPage = currentPage <= 1;
  const isLastPage = currentPage >= lastPage;

  return (
    <div style={{
      display: "flex", 
      alignItems: "center", 
      justifyContent: "space-between", 
      padding: "16px", 
      borderTop: `1px solid ${theme.borderColor}`,
      background: theme.cardColor,
      color: theme.textColor,
      fontSize: "13px"
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div>
          Showing {Math.min((currentPage - 1) * perPage + 1, total)} to {Math.min(currentPage * perPage, total)} of {total} entries
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <label style={{ color: theme.textMutedColor }}>Rows per page:</label>
          <select 
            value={perPage} 
            onChange={(e) => {
              onPerPageChange(Number(e.target.value));
              onPageChange(1); // Reset to first page
            }}
            style={{
              background: theme.inputColor,
              color: theme.textColor,
              border: `1px solid ${theme.borderColor}`,
              borderRadius: "4px",
              padding: "4px 8px",
              cursor: "pointer",
              outline: "none"
            }}
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>
      
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={isFirstPage}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            width: 32, height: 32, borderRadius: 6,
            background: isFirstPage ? theme.backgroundColor : theme.inputColor,
            color: isFirstPage ? theme.textMutedColor : theme.textColor,
            border: `1px solid ${theme.borderColor}`,
            cursor: isFirstPage ? "not-allowed" : "pointer",
            transition: "all 0.2s"
          }}
        >
          <ChevronLeft size={16} />
        </button>
        
        <span style={{ fontWeight: 500 }}>
          Page {currentPage} of {lastPage || 1}
        </span>
        
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={isLastPage}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            width: 32, height: 32, borderRadius: 6,
            background: isLastPage ? theme.backgroundColor : theme.inputColor,
            color: isLastPage ? theme.textMutedColor : theme.textColor,
            border: `1px solid ${theme.borderColor}`,
            cursor: isLastPage ? "not-allowed" : "pointer",
            transition: "all 0.2s"
          }}
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
