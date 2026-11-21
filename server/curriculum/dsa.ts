import { Difficulty } from '../../shared/types';

export interface SeedConcept {
  slug: string;
  name: string;
  description: string;
  keyFormula: string;
  orderIndex: number;
  graphX: number;
  graphY: number;
  prerequisitesSlugs: string[];
}

export interface SeedQuestion {
  conceptSlug: string;
  difficulty: Difficulty;
  questionText: string;
  options: [string, string, string, string];
  correctIndex: number;
  explanation: string;
  expectedReasoning: string;
  misconceptionIndicators: string[];
  isDiagnostic: boolean;
}

export const DSA_CONCEPTS: SeedConcept[] = [
  {
    slug: 'complexity-analysis',
    name: 'Time & Space Complexity',
    description: 'Asymptotic Big-O notation, recursion stack frames, and auxiliary memory analysis in Java.',
    keyFormula: 'O(1) < O(log N) < O(N) < O(N log N) < O(N²) < O(2^N)',
    orderIndex: 1,
    graphX: 110,
    graphY: 160,
    prerequisitesSlugs: [],
  },
  {
    slug: 'arrays-hashing',
    name: 'Arrays, Two Pointers & Hashing',
    description: 'Contiguous memory traversal, Prefix Sums, Kadane’s algorithm, and O(1) lookup via Java HashMap/HashSet.',
    keyFormula: 'map.put(arr[i], i); // O(1) avg lookup | Space: O(N)',
    orderIndex: 2,
    graphX: 110,
    graphY: 360,
    prerequisitesSlugs: ['complexity-analysis'],
  },
  {
    slug: 'binary-search-sorting',
    name: 'Binary Search & Sorting',
    description: 'Divide-and-conquer search space reduction on monotonic arrays and O(N log N) Merge/Quick Sort.',
    keyFormula: 'int mid = low + (high - low) / 2; // O(log N)',
    orderIndex: 3,
    graphX: 330,
    graphY: 160,
    prerequisitesSlugs: ['arrays-hashing'],
  },
  {
    slug: 'recursion-backtracking',
    name: 'Recursion & Backtracking',
    description: 'Call-stack state transitions, base-case termination, and undo-state exploration for subsets and permutations.',
    keyFormula: 'choose(x); backtrack(idx + 1); unchoose(x);',
    orderIndex: 4,
    graphX: 330,
    graphY: 360,
    prerequisitesSlugs: ['complexity-analysis', 'arrays-hashing'],
  },
  {
    slug: 'linked-lists-stacks',
    name: 'Linked Lists, Stacks & Queues',
    description: 'In-place pointer manipulation, Floyd’s cycle detection, and Monotonic Stack / ArrayDeque patterns.',
    keyFormula: 'ListNode next = curr.next; curr.next = prev; prev = curr;',
    orderIndex: 5,
    graphX: 550,
    graphY: 160,
    prerequisitesSlugs: ['arrays-hashing'],
  },
  {
    slug: 'trees-bst',
    name: 'Binary Trees & BST',
    description: 'Hierarchical DFS traversals (Inorder, Preorder, Postorder), BFS level-order queues, and BST range bounds.',
    keyFormula: 'isBST(node, min, max) -> left(min, node.val) && right(node.val, max)',
    orderIndex: 6,
    graphX: 550,
    graphY: 360,
    prerequisitesSlugs: ['recursion-backtracking', 'linked-lists-stacks'],
  },
  {
    slug: 'heaps-priority-queues',
    name: 'Heaps & Priority Queues',
    description: 'Binary heap invariants using Java PriorityQueue for Top-K streaming and greedy interval scheduling.',
    keyFormula: 'PriorityQueue<Integer> maxHeap = new PriorityQueue<>(Collections.reverseOrder());',
    orderIndex: 7,
    graphX: 770,
    graphY: 160,
    prerequisitesSlugs: ['trees-bst', 'binary-search-sorting'],
  },
  {
    slug: 'graphs-dp',
    name: 'Graphs & Dynamic Programming',
    description: 'Adjacency list BFS/DFS traversals, cycle detection, topological sort, and overlapping subproblem memoization.',
    keyFormula: 'dp[i] = Math.max(dp[i - 1], dp[i - 2] + nums[i]); // O(N)',
    orderIndex: 8,
    graphX: 770,
    graphY: 360,
    prerequisitesSlugs: ['trees-bst', 'recursion-backtracking'],
  },
];

export const SEED_QUESTIONS: SeedQuestion[] = [
  // 1. Complexity Analysis
  {
    conceptSlug: 'complexity-analysis',
    difficulty: 'easy',
    questionText:
      'What is the time complexity of:\nfor (int i = 1; i < n; i *= 2) { System.out.println(i); }',
    options: ['O(log N)', 'O(N)', 'O(N log N)', 'O(sqrt(N))'],
    correctIndex: 0,
    explanation: 'Because i doubles on every iteration (1, 2, 4, 8, ...), the loop executes k times where 2^k = N, giving O(log₂ N).',
    expectedReasoning: 'i multiplies by 2 each step so it takes log base 2 of N iterations to reach N.',
    misconceptionIndicators: ['linear', 'every element', 'n times', 'half'],
    isDiagnostic: true,
  },
  {
    conceptSlug: 'complexity-analysis',
    difficulty: 'medium',
    questionText:
      'What is the auxiliary space complexity of a standard recursive binary search on a sorted Java array of size N?',
    options: ['O(1)', 'O(log N)', 'O(N)', 'O(N log N)'],
    correctIndex: 1,
    explanation: 'Each recursive call halves the search range and pushes a stack frame onto the JVM call stack, reaching depth O(log N).',
    expectedReasoning: 'Recursive calls consume call stack frames proportional to the recursion depth log N.',
    misconceptionIndicators: ['o(1)', 'no extra array', 'constant space'],
    isDiagnostic: false,
  },

  // 2. Arrays & Hashing
  {
    conceptSlug: 'arrays-hashing',
    difficulty: 'easy',
    questionText:
      'In Java, which data structure gives O(1) average-case lookup to find the complement (target - nums[i]) in Two Sum?',
    options: ['ArrayList<Integer>', 'HashMap<Integer, Integer>', 'TreeSet<Integer>', 'LinkedList<Integer>'],
    correctIndex: 1,
    explanation: 'HashMap stores value-to-index pairs in hash buckets, allowing O(1) average containsKey() and get() lookups.',
    expectedReasoning: 'HashMap maps each number to its index with O(1) average hash lookup time.',
    misconceptionIndicators: ['treeset', 'sorted', 'arraylist', 'binary search'],
    isDiagnostic: true,
  },
  {
    conceptSlug: 'arrays-hashing',
    difficulty: 'medium',
    questionText:
      'In Kadane’s Algorithm for Maximum Subarray Sum, when do we reset currentSum = 0?',
    options: [
      'Whenever nums[i] is negative',
      'Whenever currentSum drops below 0',
      'Whenever nums[i] < maxSum',
      'At the end of every even index',
    ],
    correctIndex: 1,
    explanation: 'A single negative element can still bridge two large positives; only a negative running prefix sum hurts future subarrays.',
    expectedReasoning: 'A negative running sum reduces any future subarray sum, whereas a positive prefix still adds value.',
    misconceptionIndicators: ['element is negative', 'nums[i] < 0', 'any negative number'],
    isDiagnostic: false,
  },

  // 3. Binary Search & Sorting
  {
    conceptSlug: 'binary-search-sorting',
    difficulty: 'easy',
    questionText:
      'Why do Java developers write `int mid = low + (high - low) / 2` instead of `(low + high) / 2`?',
    options: [
      'It runs faster on the JVM',
      'It prevents signed 32-bit integer overflow when low + high > Integer.MAX_VALUE',
      'It handles unsorted arrays automatically',
      'It avoids ArrayIndexOutOfBoundsException when low is negative',
    ],
    correctIndex: 1,
    explanation: 'If low and high are both around 1.5 × 10^9, low + high overflows 2^31 - 1 into a negative integer.',
    expectedReasoning: 'Adding two large ints can exceed Integer.MAX_VALUE and overflow to a negative index.',
    misconceptionIndicators: ['faster', 'unsorted', 'negative low', 'division'],
    isDiagnostic: true,
  },
  {
    conceptSlug: 'binary-search-sorting',
    difficulty: 'hard',
    questionText:
      'In a rotated sorted array with distinct elements, how do you decide which half to discard at index `mid`?',
    options: [
      'Always discard the right half if nums[mid] > target',
      'Identify the sorted half (nums[low] <= nums[mid]) and check if target lies within its bounds',
      'Compare nums[mid] with nums[mid - 1]',
      'Sort the array first in O(N log N)',
    ],
    correctIndex: 1,
    explanation: 'At least one side of mid is strictly sorted. Checking whether target falls inside that sorted range preserves O(log N).',
    expectedReasoning: 'One half is always sorted; check if target lies in that sorted interval to eliminate half the array.',
    misconceptionIndicators: ['always discard', 'sort first', 'both halves unsorted'],
    isDiagnostic: false,
  },

  // 4. Recursion & Backtracking
  {
    conceptSlug: 'recursion-backtracking',
    difficulty: 'easy',
    questionText:
      'What happens at runtime in Java if a recursive method is missing a reachable base case?',
    options: [
      'Compilation error',
      'OutOfMemoryError on the heap',
      'StackOverflowError due to unbounded call-stack frames',
      'The JVM automatically terminates after 1000 calls',
    ],
    correctIndex: 2,
    explanation: 'Each recursive call pushes a frame onto the thread stack until stack memory is exhausted, throwing StackOverflowError.',
    expectedReasoning: 'Infinite recursive calls fill up the JVM call stack and throw StackOverflowError.',
    misconceptionIndicators: ['compile error', 'heap', 'outofmemory', 'automatically stops'],
    isDiagnostic: true,
  },
  {
    conceptSlug: 'recursion-backtracking',
    difficulty: 'medium',
    questionText:
      'When generating all subsets in Java using `List<Integer> current`, why must we call `current.remove(current.size() - 1)` after the recursive call?',
    options: [
      'To free memory for Garbage Collection',
      'Because current is passed by object reference and retains choices across sibling branches',
      'To keep current sorted',
      'To prevent NullPointerException',
    ],
    correctIndex: 1,
    explanation: 'All recursive branches share the same ArrayList reference; undoing the last pick restores state before exploring the next branch.',
    expectedReasoning: 'The list reference is shared across calls, so we must undo the choice when backtracking.',
    misconceptionIndicators: ['garbage collection', 'new copy', 'sorted', 'pass by value copies list'],
    isDiagnostic: false,
  },

  // 5. Linked Lists, Stacks & Queues
  {
    conceptSlug: 'linked-lists-stacks',
    difficulty: 'easy',
    questionText:
      'While reversing a singly linked list iteratively in Java, what must you save BEFORE executing `curr.next = prev`?',
    options: ['head.next', 'ListNode nextTemp = curr.next', 'prev.next', 'tail'],
    correctIndex: 1,
    explanation: 'Overwriting curr.next breaks the link to the rest of the list unless you store curr.next first.',
    expectedReasoning: 'Save curr.next in a temporary pointer before reversing curr.next to prev so the remaining list is not lost.',
    misconceptionIndicators: ['prev.next', 'head', 'after reversing'],
    isDiagnostic: true,
  },
  {
    conceptSlug: 'linked-lists-stacks',
    difficulty: 'medium',
    questionText:
      'Which Java class is recommended over `java.util.Stack` for implementing a LIFO stack or Monotonic Stack?',
    options: ['Vector<Integer>', 'ArrayDeque<Integer>', 'PriorityQueue<Integer>', 'HashSet<Integer>'],
    correctIndex: 1,
    explanation: 'ArrayDeque avoids the synchronization overhead of legacy Vector-based Stack and offers faster O(1) push/pop.',
    expectedReasoning: 'ArrayDeque is non-synchronized and faster than the legacy synchronized Stack class.',
    misconceptionIndicators: ['priorityqueue', 'vector', 'synchronized is faster'],
    isDiagnostic: false,
  },

  // 6. Binary Trees & BST
  {
    conceptSlug: 'trees-bst',
    difficulty: 'easy',
    questionText:
      'Which traversal of a Binary Search Tree (BST) visits all node values in strictly ascending sorted order?',
    options: ['Preorder (Root-Left-Right)', 'Inorder (Left-Root-Right)', 'Postorder (Left-Right-Root)', 'Level-Order BFS'],
    correctIndex: 1,
    explanation: 'In a BST, all left subtree keys < root < all right subtree keys, so Left -> Root -> Right produces sorted output.',
    expectedReasoning: 'Inorder traversal visits the smaller left subtree, then root, then larger right subtree in sorted order.',
    misconceptionIndicators: ['preorder', 'postorder', 'bfs', 'level order'],
    isDiagnostic: true,
  },
  {
    conceptSlug: 'trees-bst',
    difficulty: 'hard',
    questionText:
      'Why is checking `node.left.val < node.val && node.right.val > node.val` at every node insufficient to validate a BST?',
    options: [
      'It ignores null leaf nodes',
      'A node in the right subtree could still be smaller than an ancestor above it',
      'BSTs allow duplicate values on both sides',
      'It runs in O(N²) time',
    ],
    correctIndex: 1,
    explanation: 'Every node in a right subtree must exceed ALL ancestors above it, requiring min/max range bounds passed down recursively.',
    expectedReasoning: 'Local parent-child comparison misses violations against higher ancestors; min and max bounds are required.',
    misconceptionIndicators: ['only check children', 'duplicates', 'o(n^2)'],
    isDiagnostic: false,
  },

  // 7. Heaps & Priority Queues
  {
    conceptSlug: 'heaps-priority-queues',
    difficulty: 'medium',
    questionText:
      'What does `new PriorityQueue<Integer>()` create by default in Java, and what is the time complexity of `poll()`?',
    options: [
      'Max-Heap, O(1)',
      'Min-Heap, O(log N)',
      'Max-Heap, O(log N)',
      'Min-Heap, O(1)',
    ],
    correctIndex: 1,
    explanation: 'Java’s PriorityQueue is a binary Min-Heap by default; peek() is O(1), while poll() sifts down in O(log N).',
    expectedReasoning: 'Java PriorityQueue defaults to a Min-Heap and re-heapifies on poll() in O(log N) time.',
    misconceptionIndicators: ['max-heap', 'o(1) poll', 'largest element first'],
    isDiagnostic: true,
  },

  // 8. Graphs & Dynamic Programming
  {
    conceptSlug: 'graphs-dp',
    difficulty: 'medium',
    questionText:
      'What is the critical purpose of a `boolean[] visited` array during BFS/DFS on an undirected graph?',
    options: [
      'To sort vertices in topological order',
      'To prevent infinite loops around cycles and avoid O(2^V) redundant visits',
      'To convert the adjacency list into a matrix',
      'To guarantee shortest weighted paths',
    ],
    correctIndex: 1,
    explanation: 'Undirected edges create two-way paths (u <-> v); without visited[], traversal loops forever on cyclic components.',
    expectedReasoning: 'Tracking visited nodes prevents revisiting already explored vertices and looping infinitely in cycles.',
    misconceptionIndicators: ['weighted', 'topological', 'no cycles in undirected'],
    isDiagnostic: true,
  },
  {
    conceptSlug: 'graphs-dp',
    difficulty: 'hard',
    questionText:
      'In Dynamic Programming, how does Memoization (Top-Down) differ from Tabulation (Bottom-Up)?',
    options: [
      'Memoization uses iterative loops; Tabulation uses recursion',
      'Memoization caches recursive subproblem results on demand; Tabulation fills a DP table iteratively from base cases',
      'Tabulation always uses O(1) space',
      'Memoization works only on trees, not graphs or arrays',
    ],
    correctIndex: 1,
    explanation: 'Memoization wraps recursion with a cache (HashMap/array), whereas Tabulation builds answers iteratively starting from base states.',
    expectedReasoning: 'Memoization is recursive top-down caching, while tabulation is iterative bottom-up table filling.',
    misconceptionIndicators: ['memoization is iterative', 'tabulation is recursive', 'o(1) space'],
    isDiagnostic: false,
  },
  {
    conceptSlug: 'complexity-analysis',
    difficulty: 'medium',
    questionText:
      'What is the time complexity when an outer loop runs N times and an inner loop doubles j from 1 until it reaches N?',
    options: ['O(log N)', 'O(N)', 'O(N log N)', 'O(N²)'],
    correctIndex: 2,
    explanation: 'The inner loop performs O(log N) iterations for each of the N outer iterations.',
    expectedReasoning: 'Multiply the N outer iterations by the logarithmic inner-loop count.',
    misconceptionIndicators: ['only count inner loop once', 'quadratic by appearance', 'linear'],
    isDiagnostic: false,
  },
  {
    conceptSlug: 'complexity-analysis',
    difficulty: 'easy',
    questionText:
      'A Java method scans an array once, then performs a separate second scan. What is the combined asymptotic time?',
    options: ['O(1)', 'O(log N)', 'O(N)', 'O(N²)'],
    correctIndex: 2,
    explanation: 'The two sequential scans cost O(N) + O(N), which simplifies to O(N) after dropping constants.',
    expectedReasoning: 'Sequential phases are added, and the constant factor of two is omitted in Big-O.',
    misconceptionIndicators: ['multiply sequential phases', 'ignore input size', 'quadratic'],
    isDiagnostic: false,
  },
  {
    conceptSlug: 'arrays-hashing',
    difficulty: 'easy',
    questionText:
      'If prefix[k] stores the sum of nums[0] through nums[k - 1], how do you get the inclusive sum from index L through R?',
    options: [
      'prefix[R] - prefix[L]',
      'prefix[R + 1] - prefix[L]',
      'prefix[L + 1] - prefix[R]',
      'prefix[R + 1] + prefix[L]',
    ],
    correctIndex: 1,
    explanation: 'The prefix through R is prefix[R + 1]; subtracting the sum before L leaves exactly nums[L..R].',
    expectedReasoning: 'Use the exclusive-prefix definition and subtract the prefix that ends before L.',
    misconceptionIndicators: ['off-by-one at R', 'subtract the wrong boundary', 'add prefixes'],
    isDiagnostic: false,
  },
  {
    conceptSlug: 'arrays-hashing',
    difficulty: 'medium',
    questionText:
      'For a sorted array, which approach finds whether two values sum to a target in O(N) time and O(1) extra space?',
    options: [
      'Check every pair with two loops',
      'Use left and right pointers and move one based on the current sum',
      'Build a HashMap containing every possible pair',
      'Run binary search once for every array item',
    ],
    correctIndex: 1,
    explanation: 'With sorted values, a sum that is too small calls for a larger left value; a sum that is too large calls for a smaller right value.',
    expectedReasoning: 'Sorted order makes each pointer move safely discard impossible pairs.',
    misconceptionIndicators: ['quadratic pair scan', 'ignore sorted order', 'store all pairs'],
    isDiagnostic: false,
  },
  {
    conceptSlug: 'binary-search-sorting',
    difficulty: 'medium',
    questionText:
      'In a lower-bound search on a sorted array, what does the final low index represent?',
    options: [
      'The last index whose value is greater than the target',
      'The first index whose value is at least the target, or the array length',
      'Always the index of an exact match',
      'The midpoint from the last loop iteration',
    ],
    correctIndex: 1,
    explanation: 'The half-open lower-bound loop converges on the first position where the value is not less than target.',
    expectedReasoning: 'If every value is smaller, the insertion position is nums.length; otherwise it is the first qualifying index.',
    misconceptionIndicators: ['exact-match-only', 'last greater value', 'return final midpoint'],
    isDiagnostic: false,
  },
  {
    conceptSlug: 'binary-search-sorting',
    difficulty: 'easy',
    questionText:
      'What property must a predicate have for binary search on an answer range to be valid?',
    options: [
      'It must return true for exactly one value',
      'It must change monotonically across the searched range',
      'It must be based on a sorted array',
      'It must run in O(1) time',
    ],
    correctIndex: 1,
    explanation: 'Binary search can discard a half only when feasibility changes in one direction, such as false-to-true.',
    expectedReasoning: 'Monotonicity ensures the discarded half cannot contain another transition or valid boundary.',
    misconceptionIndicators: ['single true point', 'sorted input only', 'constant-time check required'],
    isDiagnostic: false,
  },
  {
    conceptSlug: 'recursion-backtracking',
    difficulty: 'easy',
    questionText: 'How many distinct subsets does a set of three distinct elements have?',
    options: ['3', '6', '8', '9'],
    correctIndex: 2,
    explanation: 'Each element is independently included or excluded, giving 2^3 = 8 subsets.',
    expectedReasoning: 'There are two choices for each of three elements, so multiply 2 × 2 × 2.',
    misconceptionIndicators: ['permutation count', 'one subset per element', 'n squared'],
    isDiagnostic: false,
  },
  {
    conceptSlug: 'recursion-backtracking',
    difficulty: 'medium',
    questionText:
      'Why should a backtracking solution add `new ArrayList<>(path)` to its results instead of adding `path` directly?',
    options: [
      'The copy makes each saved answer independent of later path changes',
      'ArrayList cannot be stored in another list',
      'A copy prevents recursive calls from using the JVM stack',
      'The original path is always null after recursion',
    ],
    correctIndex: 0,
    explanation: 'The same mutable path is reused across branches; copying snapshots its current contents for the result.',
    expectedReasoning: 'Saved results must not all point to the one list that backtracking continues to modify.',
    misconceptionIndicators: ['list cannot nest', 'stack is removed', 'path is immutable'],
    isDiagnostic: false,
  },
  {
    conceptSlug: 'linked-lists-stacks',
    difficulty: 'medium',
    questionText:
      'What are the time and extra-space complexities of Floyd’s fast-and-slow pointer cycle detection?',
    options: ['O(N) time and O(1) extra space', 'O(N) time and O(N) extra space', 'O(log N) time and O(1) extra space', 'O(N²) time and O(N) extra space'],
    correctIndex: 0,
    explanation: 'The pointers move through the list at most linearly, and only two node references are maintained.',
    expectedReasoning: 'Floyd’s method detects a cycle without storing a visited set.',
    misconceptionIndicators: ['visited set required', 'logarithmic list access', 'quadratic traversal'],
    isDiagnostic: false,
  },
  {
    conceptSlug: 'linked-lists-stacks',
    difficulty: 'easy',
    questionText:
      'Why does a monotonic-stack next-greater-element algorithm run in O(N) time even though it has a while loop inside a for loop?',
    options: [
      'The while loop runs exactly once for each outer iteration',
      'Each index is pushed once and popped at most once',
      'The stack contains at most one element',
      'The inner loop is skipped for sorted arrays only',
    ],
    correctIndex: 1,
    explanation: 'Across the whole algorithm, every index enters the stack once and can leave it only once.',
    expectedReasoning: 'Count total pushes and pops rather than multiplying the nested-looking loops.',
    misconceptionIndicators: ['assume nested means quadratic', 'stack always size one', 'only sorted input'],
    isDiagnostic: false,
  },
  {
    conceptSlug: 'trees-bst',
    difficulty: 'medium',
    questionText:
      'What is the worst-case time complexity of searching a binary search tree with N nodes?',
    options: ['O(1)', 'O(log N) for every tree shape', 'O(N) when the tree is skewed', 'O(N log N)'],
    correctIndex: 2,
    explanation: 'A skewed BST can have height N, so a search may visit every node.',
    expectedReasoning: 'BST search is O(H), and worst-case height is O(N).',
    misconceptionIndicators: ['balanced height guaranteed', 'constant search', 'sorting complexity'],
    isDiagnostic: false,
  },
  {
    conceptSlug: 'trees-bst',
    difficulty: 'easy',
    questionText:
      'When a BFS must return one list of nodes per tree depth, when should it record the queue size for that level?',
    options: [
      'After processing all remaining levels',
      'Once at the start of each level, before removing its nodes',
      'After every child is enqueued',
      'Only when the queue contains one node',
    ],
    correctIndex: 1,
    explanation: 'The queue size at the start of a level is the number of nodes belonging to that level.',
    expectedReasoning: 'Process exactly that many queued nodes before handling the next level.',
    misconceptionIndicators: ['count newly enqueued nodes as current level', 'one global queue pass', 'single-node-only'],
    isDiagnostic: false,
  },
  {
    conceptSlug: 'heaps-priority-queues',
    difficulty: 'medium',
    questionText:
      'To find the Kth largest value in an unsorted array, why can a min-heap of size K be sufficient?',
    options: [
      'Its root is the smallest among the K largest values retained so far',
      'Its root is always the largest value in the input',
      'A size-K heap sorts the full array',
      'It discards every duplicate automatically',
    ],
    correctIndex: 0,
    explanation: 'After processing all values, the smallest retained member of the largest K values is the Kth largest.',
    expectedReasoning: 'Discard the heap minimum whenever the heap grows beyond K.',
    misconceptionIndicators: ['root is global maximum', 'heap fully sorted', 'duplicates removed'],
    isDiagnostic: false,
  },
  {
    conceptSlug: 'heaps-priority-queues',
    difficulty: 'easy',
    questionText:
      'What does `peek()` return from a default Java `PriorityQueue<Integer>` when it is not empty?',
    options: ['The largest integer', 'The smallest integer', 'The most recently inserted integer', 'A random integer'],
    correctIndex: 1,
    explanation: 'The default natural ordering makes Java PriorityQueue a min-priority queue.',
    expectedReasoning: 'The root is the minimum element, and peek reads it without removing it.',
    misconceptionIndicators: ['default max-heap', 'queue insertion order', 'peek removes the value'],
    isDiagnostic: false,
  },
  {
    conceptSlug: 'graphs-dp',
    difficulty: 'easy',
    questionText:
      'In an unweighted graph represented by adjacency lists, what is the time complexity of BFS over all reachable vertices?',
    options: ['O(V + E)', 'O(V² + E)', 'O(log V)', 'O(E log V)'],
    correctIndex: 0,
    explanation: 'BFS visits each reachable vertex and scans each reachable adjacency-list edge at most once.',
    expectedReasoning: 'The traversal work is proportional to the vertices and edges it examines.',
    misconceptionIndicators: ['matrix scan on adjacency list', 'sorting required', 'logarithmic traversal'],
    isDiagnostic: false,
  },
  {
    conceptSlug: 'graphs-dp',
    difficulty: 'medium',
    questionText:
      'In Kahn’s topological-sort algorithm, what does processing fewer than V vertices indicate?',
    options: [
      'The graph is disconnected',
      'The directed graph contains a cycle',
      'Every vertex has indegree zero',
      'The graph has no edges',
    ],
    correctIndex: 1,
    explanation: 'A remaining directed cycle prevents all its vertices from reaching indegree zero.',
    expectedReasoning: 'If the queue empties before all vertices are removed, some cycle remains.',
    misconceptionIndicators: ['disconnected means cyclic', 'all vertices source nodes', 'no-edge condition'],
    isDiagnostic: false,
  },
];