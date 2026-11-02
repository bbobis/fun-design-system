import { DEMO_NETWORK } from './pipeline-map.fixtures';
import {
  isArrowKey,
  nextInDirection,
  type ArrowKey,
} from './pipeline-navigation';

/*
 *   Terminal A ── Station B ── Station C ── Tank Farm D
 *                     │             │
 *                Terminal E         └───────── Refinery F   (C-F: down, then right)
 */
const go = (from: string, key: ArrowKey) =>
  nextInDirection(from, key, DEMO_NETWORK);

describe('nextInDirection', () => {
  it('from a facility, moves onto the pipe leaving that way', () => {
    expect(go('B', 'ArrowRight')).toBe('B-C');
    expect(go('B', 'ArrowLeft')).toBe('A-B');
    expect(go('B', 'ArrowDown')).toBe('B-E');
  });

  it('from a pipe, moves to the facility at that end', () => {
    expect(go('A-B', 'ArrowRight')).toBe('B');
    expect(go('A-B', 'ArrowLeft')).toBe('A');
    expect(go('B-E', 'ArrowUp')).toBe('B');
    expect(go('B-E', 'ArrowDown')).toBe('E');
  });

  it('two presses get from one facility to the next', () => {
    expect(go(go('A', 'ArrowRight') ?? '', 'ArrowRight')).toBe('B');
  });

  it('an elbow pipe leaves its facility the way its first leg goes', () => {
    // C-F starts by going down from Station C.
    expect(go('C', 'ArrowDown')).toBe('C-F');
    expect(go('C', 'ArrowRight')).toBe('C-D');
  });

  it("from an elbow pipe's middle, each end lies where it looks like it does", () => {
    expect(go('C-F', 'ArrowRight')).toBe('F');
    expect(go('C-F', 'ArrowUp')).toBe('C');
  });

  it('stays put (null) when nothing lies that way, and does not wrap', () => {
    expect(go('A', 'ArrowLeft')).toBeNull();
    expect(go('A', 'ArrowUp')).toBeNull();
    expect(go('D', 'ArrowRight')).toBeNull();
    expect(go('A-B', 'ArrowUp')).toBeNull();
  });

  it('gives null for an unknown id', () => {
    expect(go('nope', 'ArrowRight')).toBeNull();
  });
});

describe('isArrowKey', () => {
  it('accepts the four arrows only', () => {
    expect(isArrowKey('ArrowUp')).toBe(true);
    expect(isArrowKey('Tab')).toBe(false);
  });
});
