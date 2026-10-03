export type PositionedItem = {
  id: string;
  position: number;
};

const POSITION_STEP = 1000;
const MIN_POSITION_GAP = 0.000001;

function insertionIndex(
  items: PositionedItem[],
  requestedPosition: number | undefined,
): number {
  if (requestedPosition === undefined) {
    return items.length;
  }

  const index = items.findIndex((item) => item.position >= requestedPosition);
  return index === -1 ? items.length : index;
}

function positionAt(items: PositionedItem[], index: number): number | null {
  const previous = items[index - 1];
  const next = items[index];

  if (previous && next) {
    const gap = next.position - previous.position;
    if (gap <= MIN_POSITION_GAP) {
      return null;
    }

    const midpoint = previous.position + gap / 2;
    return midpoint > previous.position && midpoint < next.position
      ? midpoint
      : null;
  }

  const position = previous
    ? previous.position + POSITION_STEP
    : next
      ? next.position - POSITION_STEP
      : POSITION_STEP;

  return Number.isFinite(position) &&
    (!previous || position > previous.position) &&
    (!next || position < next.position)
    ? position
    : null;
}

export async function choosePosition(
  items: PositionedItem[],
  requestedPosition: number | undefined,
  rebalance: () => Promise<PositionedItem[]>,
): Promise<number> {
  const index = insertionIndex(items, requestedPosition);
  const position = positionAt(items, index);

  if (position !== null) {
    return position;
  }

  const rebalancedItems = await rebalance();
  const rebalancedPosition = positionAt(rebalancedItems, index);

  if (rebalancedPosition === null) {
    throw new Error('Unable to allocate an ordered position after rebalancing');
  }

  return rebalancedPosition;
}
