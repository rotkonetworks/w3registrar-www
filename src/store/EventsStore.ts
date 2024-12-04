import { proxy, subscribe } from "valtio"

export interface PendingBlock {
  hash: string,
  number: number,
  data: any[], // TODO
}
export const pendingBlocks: Record<number, PendingBlock> = proxy({})
export const hashesForBlocks: Record<string, PendingBlock> = proxy({})
const maxBlocksToPreserve = 25

const deleteOldBlocks = (blockNumber) => {
  const lastBlockToPreserve = blockNumber - maxBlocksToPreserve

  const blockNumbers = Object.values(pendingBlocks)
  const blocksToDiscard = blockNumbers.filter(([number]) => number < lastBlockToPreserve)
  blocksToDiscard.forEach(([number, block]) => {
    delete pendingBlocks[number]
    delete hashesForBlocks[block.hash]
  })
}

export const addPendingBlock = (block: PendingBlock) => {
  pendingBlocks[block.number] = block
  hashesForBlocks[block.hash] = block
  deleteOldBlocks(block.number)
}

