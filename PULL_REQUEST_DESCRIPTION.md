# Add Total Revenue, Projected P/L, Deficit/Surplus to PDFs; include animal acquisition in breeding finances; move Support to mobile nav

This branch implements the requested reporting and UI changes:

- Export PDF:
  - Added "Total Revenue", "Projected P/L", and "Deficit/Surplus" boxes in the Summary section.
  - Added descriptive computation lines for:
    - Realized P/L = Total Revenue - Total Costs
    - Projected P/L = Estimated Revenue - Total Costs
- Monthly UI:
  - Added formula text under Realized P/L and Projected P/L.
  - Hides per-month "Total Produce" for projects that have totalItemCount === 0 (so breeding monthly cards no longer show produce counts).
- Breeding finance:
  - Include acquisition cost for purchased animals (animal.acquisitionCost) in monthly aggregation (uses animal.createdAt month).
- Settings / Mobile nav:
  - Removed Support (Donate) from the mobile settings sheet and placed a centered Donate button in the mobile bottom nav.

Files changed:
- src/lib/pdfExport.ts
- src/components/MonthlySummary.tsx
- src/lib/breedingFinance.ts
- src/components/MobileSettingsSheet.tsx
- src/components/MobileNavBar.tsx

Please review and let me know if you'd like adjustments.