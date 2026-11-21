import { useState } from 'react';
import { LearningModuleItem } from '../../shared/types';

const EXAMPLES: Record<LearningModuleItem['simulatorType'], { title: string; code: string; complexity: string }> = {
  complexity: {
    title: 'Nested-loop complexity',
    code: 'for (int i = 0; i < n; i++) {\n  for (int j = 1; j < n; j *= 2) {\n    work();\n  }\n}',
    complexity: 'O(N log N)',
  },
  arrays: {
    title: 'One-pass array scan',
    code: 'int max = nums[0];\nfor (int value : nums) {\n  max = Math.max(max, value);\n}',
    complexity: 'O(N) time · O(1) space',
  },
  'binary-search': {
    title: 'Binary search',
    code: 'while (low <= high) {\n  int mid = low + (high - low) / 2;\n  if (nums[mid] == target) return mid;\n  if (nums[mid] < target) low = mid + 1;\n  else high = mid - 1;\n}',
    complexity: 'O(log N) time',
  },
  recursion: {
    title: 'Backtracking subsets',
    code: 'void backtrack(int start) {\n  result.add(new ArrayList<>(path));\n  for (int i = start; i < nums.length; i++) {\n    path.add(nums[i]);\n    backtrack(i + 1);\n    path.remove(path.size() - 1);\n  }\n}',
    complexity: 'O(N · 2ᴺ) time · O(N) stack',
  },
  'linked-list': {
    title: 'Reverse a linked list',
    code: 'ListNode prev = null, curr = head;\nwhile (curr != null) {\n  ListNode next = curr.next;\n  curr.next = prev;\n  prev = curr;\n  curr = next;\n}',
    complexity: 'O(N) time · O(1) space',
  },
  trees: {
    title: 'Tree depth-first traversal',
    code: 'int maxDepth(TreeNode node) {\n  if (node == null) return 0;\n  int left = maxDepth(node.left);\n  int right = maxDepth(node.right);\n  return 1 + Math.max(left, right);\n}',
    complexity: 'O(N) time · O(H) stack',
  },
  heaps: {
    title: 'Keep the K largest values',
    code: 'PriorityQueue<Integer> minHeap = new PriorityQueue<>();\nfor (int value : nums) {\n  minHeap.offer(value);\n  if (minHeap.size() > k) minHeap.poll();\n}',
    complexity: 'O(N log K) time · O(K) space',
  },
  'graphs-dp': {
    title: 'Breadth-first graph traversal',
    code: 'Queue<Integer> queue = new ArrayDeque<>();\nqueue.offer(start);\nvisited[start] = true;\nwhile (!queue.isEmpty()) {\n  int node = queue.poll();\n  for (int next : graph.get(node)) {\n    if (!visited[next]) {\n      visited[next] = true;\n      queue.offer(next);\n    }\n  }\n}',
    complexity: 'O(V + E) time',
  },
};

export function ModuleSimulator({ type }: { type: LearningModuleItem['simulatorType'] }) {
  const [inputSize, setInputSize] = useState(16);
  const example = EXAMPLES[type];
  const logarithm = Math.ceil(Math.log2(inputSize));
  const estimatedOperations = {
    complexity: inputSize * logarithm,
    arrays: inputSize,
    'binary-search': logarithm,
    recursion: 2 ** Math.min(inputSize, 12),
    'linked-list': inputSize,
    trees: inputSize,
    heaps: logarithm,
    'graphs-dp': inputSize * 2,
  }[type];
  const visualCount = Math.min(inputSize, 16);

  return (
    <section className="rounded-2xl border border-[#E2E6F3] dark:border-[#2B3150] bg-[#EEF1FA]/60 dark:bg-[#212640]/80 p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h4 className="font-display text-sm font-semibold text-[#14172B] dark:text-[#F4F6FF]">
            Java Algorithm Playground · {example.title}
          </h4>
          <p className="text-xs text-[#6E7696] dark:text-[#8892B5] mt-1">{example.complexity}</p>
        </div>
        <span className="rounded-lg bg-white dark:bg-[#181B2E] px-3 py-1.5 font-mono text-xs font-semibold text-[#7055F7] dark:text-[#A493FF]">
          N = {inputSize}
        </span>
      </div>

      <label className="block space-y-1.5 text-xs text-[#4E5674] dark:text-[#B4BDD9]">
        <span className="flex justify-between">
          <span>Input size</span>
          <strong className="font-mono text-[#14172B] dark:text-[#F4F6FF]">{inputSize} items</strong>
        </span>
        <input
          aria-label="Algorithm input size"
          type="range"
          min={4}
          max={64}
          step={4}
          value={inputSize}
          onChange={(event) => setInputSize(Number(event.target.value))}
          className="w-full accent-[#7055F7]"
        />
      </label>

      <pre className="overflow-x-auto rounded-xl bg-[#14172B] p-4 text-xs leading-5 text-[#DCE5FF]">
        <code>{example.code}</code>
      </pre>

      <div className="flex flex-wrap items-end gap-1.5" aria-label={`Input visualization with ${visualCount} items`}>
        {Array.from({ length: visualCount }, (_, index) => (
          <span
            key={index}
            className="flex h-8 min-w-8 items-center justify-center rounded-md border border-[#CBD3E8] dark:border-[#3C456D] bg-white dark:bg-[#181B2E] px-2 font-mono text-[10px] text-[#4E5674] dark:text-[#B4BDD9]"
          >
            {index + 1}
          </span>
        ))}
        {inputSize > visualCount && (
          <span className="px-1 text-xs text-[#6E7696] dark:text-[#8892B5]">+{inputSize - visualCount} more</span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="rounded-xl bg-white dark:bg-[#181B2E] border border-[#E2E6F3] dark:border-[#2B3150] p-3">
          <span className="text-[#6E7696] dark:text-[#8892B5]">Estimated work</span>
          <p className="mt-0.5 font-mono text-base font-semibold tabular-nums text-[#14172B] dark:text-[#F4F6FF]">
            {estimatedOperations.toLocaleString()} ops
          </p>
        </div>
        <div className="rounded-xl bg-white dark:bg-[#181B2E] border border-[#E2E6F3] dark:border-[#2B3150] p-3">
          <span className="text-[#6E7696] dark:text-[#8892B5]">Input growth</span>
          <p className="mt-0.5 font-mono text-base font-semibold text-[#14172B] dark:text-[#F4F6FF]">
            {type === 'binary-search' || type === 'heaps' ? 'logarithmic' : type === 'recursion' ? 'exponential' : 'linear'}
          </p>
        </div>
      </div>
    </section>
  );
}
