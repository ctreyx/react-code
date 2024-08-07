export const NoFlags = /*                      */ 0b000000000000000000000000;
export const PerformedWork = /*                */ 0b000000000000000000000001;
export const Placement = /*                    */ 0b000000000000000000000010;
export const Update = /*                       */ 0b000000000000000000000100;
export type Flags = number;

const unknownFlags = Placement;
Boolean(unknownFlags & Placement); // true
Boolean(unknownFlags & Update); //false
