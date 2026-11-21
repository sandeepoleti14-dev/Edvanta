export interface SyllabusModuleSeed {
  conceptSlug: string;
  orderIndex: number;
  title: string;
  subtitle: string;
  estimatedMinutes: number;
  unitsNote: string;
  objectives: string[];
  coreExplanation: string;
  workedExample: {
    problem: string;
    steps: string[];
    answer: string;
  };
  misconceptionWatch: string;
  simulatorType: 'complexity' | 'arrays' | 'binary-search' | 'recursion' | 'linked-list' | 'trees' | 'heaps' | 'graphs-dp';
  quickCheck: {
    question: string;
    options: [string, string, string, string];
    correctIndex: number;
    explanation: string;
  };
}

export const DSA_MODULES: SyllabusModuleSeed[] = [
  {
    conceptSlug: 'complexity-analysis',
    orderIndex: 1,
    title: '01. Time & Space Complexity (Big-O)',
    subtitle: 'Analyzing worst-case operations and JVM recursion stack memory',
    estimatedMinutes: 8,
    unitsNote: 'N = input size · Auxiliary space excludes input array · JVM stack depth = recursion depth',
    objectives: [
      'Identify O(1), O(log N), O(N), O(N log N), and O(N²) growth rates from Java loops',
      'Distinguish auxiliary heap memory from recursive call-stack frames',
    ],
    coreExplanation:
      'Big-O measures how operations scale as input size N grows large, dropping constants and lower-order terms. Loops that halve or double the index run in O(log N), while nested loops scanning N elements run in O(N²).',
    workedExample: {
      problem: 'Analyze time & space of: int sum = 0; for (int i = 0; i < n; i++) { for (int j = 1; j < n; j *= 2) sum++; }',
      steps: [
        'Outer loop runs N times (i = 0 to n - 1).',
        'Inner loop doubles j each step (1, 2, 4, ... < n), executing log₂(N) times per outer iteration.',
        'Total operations = N × log₂(N); only primitive variables sum, i, j are allocated.',
      ],
      answer: 'Time Complexity: O(N log N) | Auxiliary Space: O(1)',
    },
    misconceptionWatch: 'Not every nested loop is O(N²)—always check how the inner loop variable updates!',
    simulatorType: 'complexity',
    quickCheck: {
      question: 'What is the time complexity of `Arrays.sort(int[] arr)` in Java (Dual-Pivot Quicksort)?',
      options: ['O(N)', 'O(N log N) average', 'O(log N)', 'O(1)'],
      correctIndex: 1,
      explanation: 'Java’s Dual-Pivot Quicksort partitions the array recursively in O(N log N) average time.',
    },
  },
  {
    conceptSlug: 'arrays-hashing',
    orderIndex: 2,
    title: '02. Arrays, Two Pointers & Hashing',
    subtitle: 'Java HashMap frequency tables, Prefix Sums, and Kadane’s Algorithm',
    estimatedMinutes: 10,
    unitsNote: 'HashMap<K, V> avg get/put: O(1) · Array random access: O(1)',
    objectives: [
      'Replace O(N²) nested scans with O(N) single-pass HashMap lookups',
      'Apply Kadane’s Algorithm and Two Pointers on contiguous arrays',
    ],
    coreExplanation:
      'Trading O(N) auxiliary space for a Java HashMap or HashSet reduces pair-sum and duplicate searches from O(N²) to O(N). For contiguous subarrays, Prefix Sums and Kadane’s running sum avoid recomputing ranges.',
    workedExample: {
      problem: 'Java Two Sum: Return indices of two numbers in `int[] nums` adding up to `target`.',
      steps: [
        'Map<Integer, Integer> seen = new HashMap<>();',
        'for (int i = 0; i < nums.length; i++) { int need = target - nums[i]; if (seen.containsKey(need)) return new int[]{seen.get(need), i}; seen.put(nums[i], i); }',
        'Each element is visited and hashed once.',
      ],
      answer: 'Time: O(N) | Space: O(N)',
    },
    misconceptionWatch: 'Check `seen.containsKey(need)` BEFORE `seen.put(nums[i], i)` so an element is not paired with itself.',
    simulatorType: 'arrays',
    quickCheck: {
      question: 'Which Java method safely returns 0 when a key is not yet in `Map<Integer, Integer> freq`?',
      options: ['freq.get(k)', 'freq.getOrDefault(k, 0)', 'freq.putIfAbsent(k, 0)', 'freq.contains(k)'],
      correctIndex: 1,
      explanation: 'getOrDefault(k, 0) avoids NullPointerException when unboxing a missing Integer key.',
    },
  },
  {
    conceptSlug: 'binary-search-sorting',
    orderIndex: 3,
    title: '03. Binary Search & Sorting',
    subtitle: 'Halving monotonic search spaces without integer overflow',
    estimatedMinutes: 10,
    unitsNote: 'Condition: Sorted or monotonic predicate · Overflow-safe mid: low + (high - low) / 2',
    objectives: [
      'Write bug-free iterative Binary Search in Java',
      'Adapt Binary Search to rotated sorted arrays and answer-space problems',
    ],
    coreExplanation:
      'Binary Search eliminates half of the remaining candidates on every comparison, finding targets in 1,000,000 elements in at most 20 steps.',
    workedExample: {
      problem: 'Standard Java Binary Search template on sorted `int[] arr`.',
      steps: [
        'int low = 0, high = arr.length - 1;',
        'while (low <= high) { int mid = low + (high - low) / 2; if (arr[mid] == target) return mid; if (arr[mid] < target) low = mid + 1; else high = mid - 1; }',
        'return -1;',
      ],
      answer: 'Time: O(log N) | Space: O(1)',
    },
    misconceptionWatch: 'Using `low < high` with `high = mid - 1` skips checking the final element when `low == high`.',
    simulatorType: 'binary-search',
    quickCheck: {
      question: 'At most how many comparisons does Binary Search need on a sorted array of 1,024 elements?',
      options: ['10', '512', '1024', '32'],
      correctIndex: 0,
      explanation: 'Since 2^10 = 1024, halving 10 times reduces the search space to 1 element.',
    },
  },
  {
    conceptSlug: 'recursion-backtracking',
    orderIndex: 4,
    title: '04. Recursion & Backtracking',
    subtitle: 'State-space tree exploration with Choose -> Explore -> Unchoose',
    estimatedMinutes: 12,
    unitsNote: 'Subsets count: 2^N · Permutations count: N! · Always clone list on snapshot',
    objectives: [
      'Trace JVM call-stack execution for recursive functions',
      'Implement Backtracking with proper state cleanup in Java',
    ],
    coreExplanation:
      'Backtracking builds candidate solutions incrementally and abandons ("backtracks" from) a branch as soon as it violates constraints or finishes.',
    workedExample: {
      problem: 'Java Backtracking snippet for Subsets of `int[] nums`:',
      steps: [
        'res.add(new ArrayList<>(curr)); // snapshot current subset',
        'for (int i = start; i < nums.length; i++) { curr.add(nums[i]); backtrack(i + 1, nums, curr, res); curr.remove(curr.size() - 1); }',
        'Removing the last element restores `curr` for the next loop iteration.',
      ],
      answer: 'Time: O(N · 2^N) | Auxiliary Stack Space: O(N)',
    },
    misconceptionWatch: 'Writing `res.add(curr)` without `new ArrayList<>(curr)` results in a list of empty lists at the end!',
    simulatorType: 'recursion',
    quickCheck: {
      question: 'How many total subsets exist for a distinct array of length N = 4?',
      options: ['8', '16', '24', '12'],
      correctIndex: 1,
      explanation: 'Each element has 2 choices (include or exclude), giving 2^4 = 16 subsets.',
    },
  },
  {
    conceptSlug: 'linked-lists-stacks',
    orderIndex: 5,
    title: '05. Linked Lists, Stacks & Queues',
    subtitle: 'Pointer rewiring, Floyd’s Cycle Detection, and Monotonic Stacks',
    estimatedMinutes: 10,
    unitsNote: 'Use ArrayDeque<T> for O(1) Stack/Queue · Dummy head simplifies edge cases',
    objectives: [
      'Reverse a singly linked list in-place in O(N) time and O(1) space',
      'Solve Next Greater Element problems using a Monotonic Stack',
    ],
    coreExplanation:
      'Linked lists excel at O(1) pointer insertion/deletion once positioned, while Monotonic Stacks maintain sorted invariants to find nearest greater/smaller elements in a single linear pass.',
    workedExample: {
      problem: 'In-place Singly Linked List Reversal in Java:',
      steps: [
        'ListNode prev = null, curr = head;',
        'while (curr != null) { ListNode next = curr.next; curr.next = prev; prev = curr; curr = next; }',
        'return prev; // new head of reversed list',
      ],
      answer: 'Time: O(N) | Auxiliary Space: O(1)',
    },
    misconceptionWatch: 'Always guard `fast != null && fast.next != null` in two-pointer list loops.',
    simulatorType: 'linked-list',
    quickCheck: {
      question: 'In Floyd’s Cycle Detection, if `slow` moves 1 step and `fast` moves 2 steps, what happens when a cycle exists?',
      options: ['fast jumps over slow forever', 'fast and slow are guaranteed to meet inside the cycle', 'slow reaches null', 'Infinite recursion occurs'],
      correctIndex: 1,
      explanation: 'Inside the cycle, fast closes the gap to slow by 1 node per step, guaranteeing a collision.',
    },
  },
  {
    conceptSlug: 'trees-bst',
    orderIndex: 6,
    title: '06. Binary Trees & BST',
    subtitle: 'Recursive DFS traversals, BFS level order, and BST range invariants',
    estimatedMinutes: 12,
    unitsNote: 'Balanced BST height: O(log N) · Skewed tree height: O(N)',
    objectives: [
      'Compute tree height, diameter, and Lowest Common Ancestor via postorder DFS',
      'Validate Binary Search Trees using min/max ancestor bounds',
    ],
    coreExplanation:
      'Almost every Binary Tree problem breaks down into asking left and right children for sub-results and combining them at the current `TreeNode`.',
    workedExample: {
      problem: 'Maximum Depth of a Binary Tree in Java:',
      steps: [
        'if (root == null) return 0;',
        'int leftDepth = maxDepth(root.left); int rightDepth = maxDepth(root.right);',
        'return 1 + Math.max(leftDepth, rightDepth);',
      ],
      answer: 'Time: O(N) | Space: O(H) where H is tree height',
    },
    misconceptionWatch: 'Checking only immediate children fails BST validation when a deep descendant violates an ancestor’s bound.',
    simulatorType: 'trees',
    quickCheck: {
      question: 'What is the worst-case search time in an unbalanced Binary Search Tree of N nodes?',
      options: ['O(1)', 'O(log N)', 'O(N)', 'O(N log N)'],
      correctIndex: 2,
      explanation: 'Inserting sorted elements into a BST creates a skewed chain of height N, degrading search to O(N).',
    },
  },
  {
    conceptSlug: 'heaps-priority-queues',
    orderIndex: 7,
    title: '07. Heaps & Priority Queues',
    subtitle: 'Top-K streaming queries with Java PriorityQueue',
    estimatedMinutes: 9,
    unitsNote: 'peek(): O(1) · offer() / poll(): O(log K) · Build heap: O(N)',
    objectives: [
      'Configure Min-Heaps, Max-Heaps, and custom lambda comparators in Java',
      'Maintain a fixed size-K heap for Top-K Largest/Smallest problems in O(N log K)',
    ],
    coreExplanation:
      'A PriorityQueue keeps the extreme (smallest or largest) element at the root in O(log N) per update without sorting the entire collection.',
    workedExample: {
      problem: 'Find the Kth Largest element in `int[] nums` using a size-K Min-Heap:',
      steps: [
        'PriorityQueue<Integer> pq = new PriorityQueue<>();',
        'for (int x : nums) { pq.offer(x); if (pq.size() > k) pq.poll(); }',
        'return pq.peek(); // root holds the Kth largest element',
      ],
      answer: 'Time: O(N log K) | Space: O(K)',
    },
    misconceptionWatch: 'Java’s default PriorityQueue is a Min-Heap—use `Collections.reverseOrder()` for a Max-Heap.',
    simulatorType: 'heaps',
    quickCheck: {
      question: 'What is the time complexity of `pq.peek()` on a Java PriorityQueue of size N?',
      options: ['O(1)', 'O(log N)', 'O(N)', 'O(N log N)'],
      correctIndex: 0,
      explanation: 'peek() simply reads index 0 of the underlying binary heap array without modifying structure.',
    },
  },
  {
    conceptSlug: 'graphs-dp',
    orderIndex: 8,
    title: '08. Graphs & Dynamic Programming',
    subtitle: 'Adjacency List BFS/DFS and Memoized State Transitions',
    estimatedMinutes: 14,
    unitsNote: 'Graph BFS/DFS: O(V + E) · DP = Optimal Substructure + Overlapping Subproblems',
    objectives: [
      'Traverse graphs safely using `List<List<Integer>> adj` and `boolean[] visited`',
      'Convert exponential recursive trees into O(N) Dynamic Programming solutions',
    ],
    coreExplanation:
      'Graphs model arbitrary networks using adjacency lists in O(V + E) time, while Dynamic Programming eliminates exponential recomputation by storing overlapping subproblem answers.',
    workedExample: {
      problem: 'House Robber 1D Dynamic Programming in Java:',
      steps: [
        'int prev2 = 0, prev1 = 0;',
        'for (int money : nums) { int curr = Math.max(prev1, prev2 + money); prev2 = prev1; prev1 = curr; }',
        'return prev1;',
      ],
      answer: 'Time: O(N) | Space: O(1)',
    },
    misconceptionWatch: 'Always mark graph nodes `visited[v] = true` when adding to the BFS queue, not when polling.',
    simulatorType: 'graphs-dp',
    quickCheck: {
      question: 'What is the time complexity of BFS on a graph with V vertices and E edges using an adjacency list?',
      options: ['O(V²)', 'O(V + E)', 'O(V · E)', 'O(E log V)'],
      correctIndex: 1,
      explanation: 'Each vertex is enqueued once (O(V)) and each adjacency edge is inspected once (O(E)).',
    },
  },
];