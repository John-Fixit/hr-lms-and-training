export const PAGE_ELLIPSIS = "…";

/**
 * Compact page list for pagination controls, e.g. for page 6 of 43:
 * [1, "…", 5, 6, 7, "…", 43]. Always keeps the first and last page and
 * `siblings` pages either side of the current one, so the control has a
 * fixed maximum width regardless of how many pages there are.
 */
export const getPaginationRange = (currentPage, totalPages, siblings = 1) => {
  // first + last + current + siblings on both sides + two ellipsis slots
  const maxItems = siblings * 2 + 5;
  if (totalPages <= maxItems) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const start = Math.max(2, currentPage - siblings);
  const end = Math.min(totalPages - 1, currentPage + siblings);
  const showLeftEllipsis = start > 3;
  const showRightEllipsis = end < totalPages - 2;

  // Near either edge, extend the window so the item count stays constant.
  const windowSize = siblings * 2 + 3;
  if (!showLeftEllipsis) {
    return [
      ...Array.from({ length: windowSize }, (_, i) => i + 1),
      PAGE_ELLIPSIS,
      totalPages,
    ];
  }
  if (!showRightEllipsis) {
    return [
      1,
      PAGE_ELLIPSIS,
      ...Array.from({ length: windowSize }, (_, i) => totalPages - windowSize + 1 + i),
    ];
  }
  return [
    1,
    PAGE_ELLIPSIS,
    ...Array.from({ length: end - start + 1 }, (_, i) => start + i),
    PAGE_ELLIPSIS,
    totalPages,
  ];
};
