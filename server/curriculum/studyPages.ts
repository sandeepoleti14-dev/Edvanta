import type { StudyPage } from '../../shared/types';

export const DSA_STUDY_PAGES: Record<string, StudyPage[]> = {
  'complexity-analysis': [
    {
      title: 'Read the growth, not the code length',
      subtitle: 'A practical model for choosing and explaining Big-O',
      sections: [
        {
          heading: 'What complexity answers',
          paragraphs: [
            'Complexity describes how an algorithm’s work or extra memory changes as the input size N grows. It is not a stopwatch reading: machine speed and constant setup costs matter less than the growth pattern.',
            'Big-O is an upper-bound description. In interview analysis, count the dominant operations, drop constant factors, and keep the fastest-growing term.',
          ],
          bullets: [
            'O(1): a fixed amount of work, such as reading arr[index].',
            'O(log N): repeatedly discard a constant fraction of the remaining input.',
            'O(N): inspect each item a constant number of times.',
            'O(N log N): process N items across logarithmically many levels, as in merge sort.',
            'O(N²): compare many pairs, often from two independent loops.',
          ],
        },
        {
          heading: 'A reliable counting routine',
          paragraphs: [
            'First name the input size. Then count how many times the innermost useful operation runs. For sequential phases, add costs; for nested phases, multiply only when one phase repeats inside another.',
          ],
          bullets: [
            'Ignore fixed constants: 3N + 8 is O(N).',
            'Keep the dominant term: N² + N is O(N²).',
            'Do not assume nested loops are quadratic; inspect how each loop variable changes.',
          ],
        },
      ],
      takeaway: 'Ask: how many times can the input-sized operation execute as N grows?',
    },
    {
      title: 'Recognize common loop patterns',
      subtitle: 'Turn loop updates into a count of iterations',
      sections: [
        {
          heading: 'Linear, logarithmic, and nested work',
          paragraphs: [
            'A loop that increments or decrements by one usually takes O(N) iterations. A loop that doubles or halves its value takes O(log N), because after k updates its value is multiplied by 2^k.',
            'When a logarithmic loop sits inside a linear loop, the inner work repeats N times, giving O(N log N).',
          ],
          code: `// O(log N): i doubles each iteration
for (int i = 1; i < n; i *= 2) {
    work();
}

// O(N log N): logarithmic work for each array item
for (int i = 0; i < n; i++) {
    for (int j = 1; j < n; j *= 2) {
        work();
    }
}`,
        },
        {
          heading: 'Trace a concrete input',
          paragraphs: [
            'For n = 16, the first loop visits 1, 2, 4, 8: four iterations. Since 2⁴ = 16, the count grows with log₂N, not N.',
            'In the nested example, there are about 16 outer iterations and 4 inner iterations per outer pass: about 64 calls to work(). Doubling N adds about one inner iteration, but doubles the outer work.',
          ],
        },
      ],
      takeaway: 'Increment by one suggests linear growth; multiply or divide by a constant suggests logarithmic growth.',
    },
    {
      title: 'Space, recursion, and exam practice',
      subtitle: 'Include the memory that stays alive during execution',
      sections: [
        {
          heading: 'Auxiliary space in Java',
          paragraphs: [
            'Auxiliary space is extra memory beyond the input. A few primitive variables use O(1). A new array or HashMap with one entry per input item uses O(N). Recursive calls consume JVM stack frames, so maximum recursion depth contributes to space complexity.',
          ],
          bullets: [
            'Recursive binary search: O(log N) stack depth.',
            'Iterative binary search: O(1) auxiliary space.',
            'Merge sort: O(N) temporary storage, in addition to its recursion stack.',
            'State whether you are counting output storage; many analyses exclude the returned answer.',
          ],
        },
        {
          heading: 'Worked analysis and test checklist',
          paragraphs: [
            'For the nested-loop example on the previous page, the outer loop runs N times and the inner loop runs about log₂N times. Only sum, i, and j are additional scalar variables.',
            'On a test, state the input size, count the dominant operation, analyze time and extra space separately, then explain any recursion depth.',
          ],
          code: `int sum = 0;
for (int i = 0; i < n; i++) {
    for (int j = 1; j < n; j *= 2) {
        sum++;
    }
}`,
          bullets: [
            'Time: O(N log N).',
            'Auxiliary space: O(1).',
            'A negative value inside a loop does not change its iteration count unless it changes the control flow.',
          ],
        },
      ],
      takeaway: 'Give both time and auxiliary-space bounds, and justify them with a count or memory structure.',
    },
  ],
  'arrays-hashing': [
    {
      title: 'Choose the array pattern',
      subtitle: 'Use order, contiguous ranges, and lookup needs as clues',
      sections: [
        {
          heading: 'Four patterns that solve many array problems',
          paragraphs: [
            'Arrays provide O(1) indexed reads but shifting elements costs O(N). Pick a pattern based on what the prompt asks you to preserve or find.',
          ],
          bullets: [
            'Hashing: remember values, counts, or indices for fast average lookup.',
            'Two pointers: move from one or both ends when the data is sorted or a pair condition guides movement.',
            'Sliding window: maintain a contiguous range while its boundary moves forward.',
            'Prefix sums: answer range-sum questions using cumulative totals.',
            'Kadane’s algorithm: keep the best subarray ending at the current position.',
          ],
        },
        {
          heading: 'Build a frequency map',
          paragraphs: [
            'A HashMap replaces repeated searching when the problem needs membership, a count, or a remembered index. Each insert and lookup is O(1) on average, with O(N) additional space in the worst case.',
          ],
          code: `Map<Integer, Integer> freq = new HashMap<>();
for (int value : nums) {
    freq.put(value, freq.getOrDefault(value, 0) + 1);
}`,
        },
      ],
      takeaway: 'Ask whether the key signal is fast lookup, a sorted pair, a moving range, or a contiguous sum.',
    },
    {
      title: 'Two Sum with a HashMap',
      subtitle: 'Turn a pair search into a single pass',
      sections: [
        {
          heading: 'Algorithm',
          paragraphs: [
            'For each number x, the needed partner is target - x. Widen the subtraction to long before computing it; if the result is outside the int range, it cannot match an int value. Check whether the partner has already appeared; if so, return both indices. Otherwise save x and its index.',
          ],
          bullets: [
            'Initialize an empty map from value to index.',
            'Visit indices from left to right and compute the complement.',
            'Check for the complement before inserting the current value.',
            'Return the pair when found; otherwise store the current value.',
          ],
          code: `Map<Integer, Integer> seen = new HashMap<>();
for (int i = 0; i < nums.length; i++) {
    long need = (long) target - nums[i];
    if (need >= Integer.MIN_VALUE && need <= Integer.MAX_VALUE
            && seen.containsKey((int) need)) {
        return new int[] { seen.get((int) need), i };
    }
    seen.put(nums[i], i);
}
return new int[0];`,
        },
        {
          heading: 'Dry run: nums = [2, 7, 11], target = 9',
          paragraphs: [
            'At index 0, need 7; it is not in the map, so store 2 -> 0. At index 1, need 2; the map contains it, so return [0, 1].',
            'The map makes the search linear overall. Checking before insertion also prevents using the same array element twice.',
          ],
        },
      ],
      takeaway: 'Store only what future elements need, and check before inserting when an item cannot pair with itself.',
    },
    {
      title: 'Ranges, windows, and test practice',
      subtitle: 'Handle contiguous subarrays without recomputing them',
      sections: [
        {
          heading: 'Prefix sum and sliding window',
          paragraphs: [
            'A prefix array stores the sum before or through each index. With prefix[i] defined as the sum of elements before i, the sum of [left, right] is prefix[right + 1] - prefix[left]. Use long when the total may exceed the int range.',
            'For nonnegative values and a monotonic constraint, a sliding window can expand right and shrink left while keeping its running sum. Negative values often break that monotonic behavior; prefix sums with a map may be needed instead.',
          ],
          code: `long[] prefix = new long[nums.length + 1];
for (int i = 0; i < nums.length; i++) {
    prefix[i + 1] = prefix[i] + nums[i];
}
long rangeSum = prefix[right + 1] - prefix[left];`,
        },
        {
          heading: 'Kadane’s maximum subarray',
          paragraphs: [
            'For a nonempty input, at each value either start a new subarray here or extend the previous one. Keep the best ending-here sum and the best answer seen so far; do not reset just because the current element is negative.',
          ],
          code: `int endingHere = nums[0];
int best = nums[0];
for (int i = 1; i < nums.length; i++) {
    endingHere = Math.max(nums[i], endingHere + nums[i]);
    best = Math.max(best, endingHere);
}`,
          bullets: [
            'Two Sum with a HashMap: O(N) time and O(N) space.',
            'Prefix-sum construction: O(N) time and O(N) space.',
            'Kadane’s algorithm: O(N) time and O(1) space.',
          ],
        },
      ],
      takeaway: 'Practice by explaining why each pointer moves and what information the map or running sum preserves.',
    },
  ],
  'binary-search-sorting': [
    {
      title: 'Binary search needs a monotonic rule',
      subtitle: 'Search sorted data or any true/false boundary',
      sections: [
        {
          heading: 'The discard-half invariant',
          paragraphs: [
            'Binary search is valid when the candidate range is sorted or a predicate changes monotonically from false to true (or true to false). Each comparison must prove that one half cannot contain the answer.',
            'Use a closed interval [low, high] with low = 0, high = n - 1, and while (low <= high). If mid is too small, discard through mid; otherwise discard from mid onward.',
          ],
          bullets: [
            'Compute mid as low + (high - low) / 2 to avoid overflow.',
            'Advance or retreat past mid to guarantee progress.',
            'Return a not-found value only after the interval becomes empty.',
          ],
        },
        {
          heading: 'Standard Java template',
          paragraphs: [
            'This template returns any matching index. For first/last positions or insertion points, use a boundary-search variant and state exactly what low represents when the loop ends.',
          ],
          code: `int low = 0, high = nums.length - 1;
while (low <= high) {
    int mid = low + (high - low) / 2;
    if (nums[mid] == target) return mid;
    if (nums[mid] < target) low = mid + 1;
    else high = mid - 1;
}
return -1;`,
        },
      ],
      takeaway: 'Before coding, define the interval and the condition that proves which half can be discarded.',
    },
    {
      title: 'Boundary search and answer-space search',
      subtitle: 'Find the first valid point, not just an exact match',
      sections: [
        {
          heading: 'Lower bound pattern',
          paragraphs: [
            'A lower bound finds the first index whose value is at least target. Keep a half-open interval [low, high), where high may equal n. If nums[mid] is too small, move low right; otherwise keep mid as a possible answer by moving high to mid.',
          ],
          code: `int low = 0, high = nums.length;
while (low < high) {
    int mid = low + (high - low) / 2;
    if (nums[mid] < target) low = mid + 1;
    else high = mid;
}
// low is the first index with value >= target, or nums.length`,
        },
        {
          heading: 'Binary search on an answer',
          paragraphs: [
            'Some problems ask for the smallest capacity, speed, or time that makes a condition possible. Write a feasible(x) check, confirm it is monotonic, then binary search for the first feasible x. The total cost is O(checkCost * log(range)).',
          ],
          bullets: [
            'State the low and high bounds for the answer.',
            'Prove that feasibility changes only once across the range.',
            'Use a midpoint formula that matches first-true or last-true search.',
          ],
        },
      ],
      takeaway: 'Boundary variants differ in interval definition and update rules; do not mix templates.',
    },
    {
      title: 'Sorting choices and test practice',
      subtitle: 'Know when ordering is worth its cost',
      sections: [
        {
          heading: 'Sorting as a problem-solving tool',
          paragraphs: [
            'Sorting usually costs O(N log N), then enables two pointers, deduplication, and ordered scans. Java Arrays.sort(int[]) uses a tuned primitive-array sort; Arrays.sort(Object[]) uses a stable object sort. Do not rely on implementation details when a problem only asks for asymptotic complexity.',
          ],
          bullets: [
            'Merge sort: O(N log N) time, typically O(N) auxiliary storage, stable.',
            'Quick sort: O(N log N) average time; partitioning strategy affects worst-case behavior.',
            'After sorting, two pointers often replace a nested pair scan.',
          ],
        },
        {
          heading: 'Dry run and edge-case checklist',
          paragraphs: [
            'For [1, 4, 8, 12] and target 8, the first midpoint is index 1 (value 4), so low becomes 2; the next midpoint is index 2 and matches.',
          ],
          bullets: [
            'Test an empty array, one item, a missing value, and a target at each end.',
            'For lower bound, test a target below all values and above all values.',
            'Time: O(log N) for search; iterative extra space: O(1).',
          ],
        },
      ],
      takeaway: 'For every binary search, test the smallest interval and explain why the loop terminates.',
    },
  ],
  'recursion-backtracking': [
    {
      title: 'Understand the recursive state',
      subtitle: 'Every call should represent a smaller, clearer subproblem',
      sections: [
        {
          heading: 'Three parts of a recursive method',
          paragraphs: [
            'A recursive method needs a base case, progress toward that base case, and a return/combine rule. Each Java call stores parameters and local variables in a stack frame; too much unbounded depth can cause StackOverflowError.',
          ],
          bullets: [
            'State what the method returns for the smallest input.',
            'Make every recursive call reduce the remaining work.',
            'Combine child answers only after the recursive calls return.',
          ],
        },
        {
          heading: 'Trace the call stack',
          paragraphs: [
            'For a small nonnegative n whose factorial fits in int, factorial(3) calls factorial(2) and then factorial(1). The base case returns 1; the stack then unwinds to compute 2 and then 6.',
          ],
          code: `int factorial(int n) {
    if (n == 0 || n == 1) return 1;
    return n * factorial(n - 1);
}`,
        },
      ],
      takeaway: 'Write the base case and the meaning of one call before writing the recursive step.',
    },
    {
      title: 'Backtracking: choose, explore, undo',
      subtitle: 'Search a decision tree while restoring shared state',
      sections: [
        {
          heading: 'The reusable pattern',
          paragraphs: [
            'Backtracking explores candidates one choice at a time. A call represents the decisions made so far; each loop option creates one child branch. Undo the choice after recursion so the next branch starts from the same parent state.',
          ],
          bullets: [
            'Choose an available option.',
            'Recurse with the updated state.',
            'Undo the choice before trying a sibling.',
            'Copy mutable state when saving a completed answer.',
          ],
        },
        {
          heading: 'Generate all subsets',
          paragraphs: [
            'For every element, a subset either includes it or does not. This creates 2^N results. The following loop form explores subsets by choosing the next included index.',
          ],
          code: `void build(int start, int[] nums, List<Integer> path,
           List<List<Integer>> result) {
    result.add(new ArrayList<>(path));
    for (int i = start; i < nums.length; i++) {
        path.add(nums[i]);                 // choose
        build(i + 1, nums, path, result); // explore
        path.remove(path.size() - 1);     // undo
    }
}`,
        },
      ],
      takeaway: 'Save a snapshot of the current path; never store the same mutable list for every answer.',
    },
    {
      title: 'Dry run and test checklist',
      subtitle: 'Count branches, depth, and copied output',
      sections: [
        {
          heading: 'Dry run: subsets of [a, b]',
          paragraphs: [
            'The root saves []. Choosing a adds [a]; choosing b below it saves [a, b]. After undoing b and then a, the root chooses b and saves [b]. The result has four lists: [], [a], [a, b], [b].',
            'The recursion depth is at most N. Copying each subset costs up to O(N), so listing all subsets takes O(N * 2^N) total output work.',
          ],
        },
        {
          heading: 'Test preparation',
          paragraphs: [
            'Be ready to draw the first two levels of the recursion tree, identify the base case, and state what changes and what stays shared between calls.',
          ],
          bullets: [
            'Subsets: 2^N outputs; permutations: N! outputs.',
            'Include duplicate-skipping rules when input values can repeat.',
            'Check that every choose operation has a matching undo.',
            'Avoid recursion when depth can grow too large for the JVM stack.',
          ],
        },
      ],
      takeaway: 'A correct backtracking solution has a precise state, a stopping rule, and reliable cleanup.',
    },
  ],
  'linked-lists-stacks': [
    {
      title: 'Choose a pointer or container pattern',
      subtitle: 'Know what each pointer or deque entry represents',
      sections: [
        {
          heading: 'Linked-list fundamentals',
          paragraphs: [
            'A singly linked list node stores a value and a reference to the next node. Random access is O(N), but changing a link is O(1) once the correct node is reached. Save a link before overwriting it.',
          ],
          bullets: [
            'Dummy head: simplifies insertions and deletions at the front.',
            'Fast and slow pointers: detect cycles or locate a midpoint.',
            'Reverse pointers: keep previous, current, and next references.',
          ],
        },
        {
          heading: 'Use ArrayDeque for stacks and queues',
          paragraphs: [
            'Java ArrayDeque supports efficient operations at both ends. Use push/pop for a stack, and offer/poll for a queue. It avoids the legacy Stack class and does not permit null elements.',
          ],
          code: `Deque<Integer> stack = new ArrayDeque<>();
stack.push(value);
int top = stack.pop();

Deque<Integer> queue = new ArrayDeque<>();
queue.offer(value);
Integer first = queue.poll(); // null when the queue is empty`,
        },
      ],
      takeaway: 'Name what each reference means, and preserve the next link before rewiring it.',
    },
    {
      title: 'Reverse a list and detect a cycle',
      subtitle: 'Two core pointer algorithms',
      sections: [
        {
          heading: 'Iterative reversal',
          paragraphs: [
            'At each node, save next, point current backward to previous, then advance both references. When current reaches null, previous is the new head.',
          ],
          code: `ListNode prev = null;
ListNode curr = head;
while (curr != null) {
    ListNode next = curr.next;
    curr.next = prev;
    prev = curr;
    curr = next;
}
return prev;`,
        },
        {
          heading: 'Floyd cycle detection',
          paragraphs: [
            'Move slow one link and fast two links. If a cycle exists, both pointers eventually meet inside it; if fast reaches null, the list is acyclic.',
          ],
          code: `ListNode slow = head, fast = head;
while (fast != null && fast.next != null) {
    slow = slow.next;
    fast = fast.next.next;
    if (slow == fast) return true;
}
return false;`,
        },
      ],
      takeaway: 'For list loops, guard every fast-pointer dereference and preserve links before changing them.',
    },
    {
      title: 'Monotonic stacks and test practice',
      subtitle: 'Find the nearest greater or smaller item in linear time',
      sections: [
        {
          heading: 'Next greater element',
          paragraphs: [
            'Keep indices whose values are waiting for a greater value. When a new value arrives, pop smaller values and assign their answer to the current index. Each index is pushed and popped at most once.',
          ],
          code: `int[] answer = new int[nums.length];
Arrays.fill(answer, -1);
Deque<Integer> stack = new ArrayDeque<>();
for (int i = 0; i < nums.length; i++) {
    while (!stack.isEmpty() && nums[stack.peek()] < nums[i]) {
        answer[stack.pop()] = nums[i];
    }
    stack.push(i);
}`,
        },
        {
          heading: 'Dry run and complexity',
          paragraphs: [
            'For [2, 1, 3], index 0 (value 2) and index 1 (value 1) wait on the stack. When 3 arrives, it resolves both answers. Each index enters and leaves once, so time is O(N) and space is O(N).',
          ],
          bullets: [
            'For a queue BFS, mark a node visited when enqueuing it.',
            'For a monotonic stack, decide whether equal values should remain or be popped.',
            'Test empty, one-node, and cycle cases for linked lists.',
          ],
        },
      ],
      takeaway: 'Use indices in a monotonic stack when answers must be written back to original positions.',
    },
  ],
  'trees-bst': [
    {
      title: 'Tree traversal patterns',
      subtitle: 'Pick DFS for paths and postorder summaries; BFS for levels',
      sections: [
        {
          heading: 'Depth-first search orders',
          paragraphs: [
            'Preorder processes the node before its children, inorder processes it between left and right, and postorder processes it after both children. Recursive DFS uses O(H) stack space for tree height H.',
          ],
          bullets: [
            'Preorder: copy or serialize a tree from the root.',
            'Inorder: visit a BST in sorted order.',
            'Postorder: combine child heights, sums, or validity before returning.',
          ],
        },
        {
          heading: 'Breadth-first search',
          paragraphs: [
            'BFS uses a queue and processes nodes level by level. Capture the queue size at the start of each level if the result must group nodes by depth.',
          ],
          code: `Deque<TreeNode> queue = new ArrayDeque<>();
if (root != null) queue.offer(root);
while (!queue.isEmpty()) {
    TreeNode node = queue.poll();
    if (node.left != null) queue.offer(node.left);
    if (node.right != null) queue.offer(node.right);
}`,
        },
      ],
      takeaway: 'For each recursive tree method, define what value a call returns to its parent.',
    },
    {
      title: 'Respect the full BST invariant',
      subtitle: 'Every node must satisfy all ancestor bounds',
      sections: [
        {
          heading: 'Why local comparisons fail',
          paragraphs: [
            'Checking only node.left < node and node.right > node is not enough. A node deep in the right subtree must still be greater than every ancestor that placed it there.',
            'Carry an allowed exclusive range down the tree. The left child inherits the upper bound of the current value; the right child inherits the lower bound.',
          ],
          code: `boolean valid(TreeNode node, long low, long high) {
    if (node == null) return true;
    if (node.val <= low || node.val >= high) return false;
    return valid(node.left, low, node.val)
        && valid(node.right, node.val, high);
}`,
        },
        {
          heading: 'Worked example',
          paragraphs: [
            'In a tree with root 10, value 12 in the left subtree is invalid even if 12 is larger than its immediate parent. The root passed an upper bound of 10 into its entire left subtree, so the violation is caught.',
            'Use long bounds so Integer.MIN_VALUE and Integer.MAX_VALUE can both be valid node values.',
          ],
        },
      ],
      takeaway: 'A BST is globally ordered by ancestor bounds, not only locally ordered by parent and child.',
    },
    {
      title: 'Depth, complexity, and test practice',
      subtitle: 'Translate the tree shape into runtime and stack usage',
      sections: [
        {
          heading: 'Maximum depth pattern',
          paragraphs: [
            'The depth of an empty tree is 0. For a non-empty node, compute the larger child depth and add one. Every node is visited once.',
          ],
          code: `int maxDepth(TreeNode node) {
    if (node == null) return 0;
    int left = maxDepth(node.left);
    int right = maxDepth(node.right);
    return 1 + Math.max(left, right);
}`,
        },
        {
          heading: 'What to state in an interview',
          paragraphs: [
            'Depth-first traversal costs O(N) time and O(H) call-stack space. A balanced tree has H = O(log N), but a skewed tree can have H = O(N). BFS can hold an entire level, up to O(N) nodes.',
          ],
          bullets: [
            'Test a null root, one node, and a left- or right-skewed tree.',
            'Use a queue for level-by-level output and DFS for recursive subproblems.',
            'For BST validation, test a deep descendant that breaks an ancestor bound.',
          ],
        },
      ],
      takeaway: 'Always analyze tree algorithms against height H, then give the worst case when the tree is skewed.',
    },
  ],
  'heaps-priority-queues': [
    {
      title: 'Heap invariant and Java PriorityQueue',
      subtitle: 'Keep one extreme item easy to access',
      sections: [
        {
          heading: 'What a binary heap guarantees',
          paragraphs: [
            'A binary heap is a complete binary tree stored compactly in an array. A min-heap guarantees that each parent is no greater than its children, so the minimum is at the root; it does not fully sort the remaining items.',
          ],
          bullets: [
            'peek(): O(1), read the root.',
            'offer() and poll(): O(log N), restore the heap by sifting.',
            'Build from a collection: typically O(N).',
          ],
        },
        {
          heading: 'Java min-heap and max-heap',
          paragraphs: [
            'PriorityQueue<Integer> is a min-heap by default. Reverse the comparator for a max-heap; avoid subtraction-based comparators because integer subtraction can overflow.',
          ],
          code: `PriorityQueue<Integer> minHeap = new PriorityQueue<>();
PriorityQueue<Integer> maxHeap =
    new PriorityQueue<>(Comparator.reverseOrder());`,
        },
      ],
      takeaway: 'A heap gives fast access to one extreme; use sorting when you need the entire order.',
    },
    {
      title: 'Top-K with a size-K heap',
      subtitle: 'Discard elements that cannot enter the answer',
      sections: [
        {
          heading: 'Kth largest algorithm',
          paragraphs: [
            'Keep the largest K values seen so far in a min-heap. If its size exceeds K, remove the smallest. At the end, the root is the Kth largest value.',
          ],
          code: `PriorityQueue<Integer> topK = new PriorityQueue<>();
for (int value : nums) {
    topK.offer(value);
    if (topK.size() > k) topK.poll();
}
return topK.peek();`,
        },
        {
          heading: 'Dry run: values [3, 1, 5, 2], K = 2',
          paragraphs: [
            'Insert 3 then 1: the heap contains the two values. Insert 5 and remove 1, leaving 3 and 5. Insert 2 and remove 2, leaving 3 and 5. The root 3 is the second-largest value.',
          ],
          bullets: [
            'Time: O(N log K).',
            'Extra space: O(K).',
            'Check that 1 <= K <= N before reading the heap root.',
          ],
        },
      ],
      takeaway: 'Choose the heap orientation so its root is the item you want to discard first.',
    },
    {
      title: 'Comparators and test practice',
      subtitle: 'Apply the same pattern to scheduling and merging',
      sections: [
        {
          heading: 'Custom ordering',
          paragraphs: [
            'A comparator defines priority. For intervals ordered by end time, use Integer.compare(a.end, b.end), not a.end - b.end. For objects, provide a comparator that clearly states which item should be polled first.',
          ],
          code: `PriorityQueue<int[]> byEnd =
    new PriorityQueue<>((a, b) ->
        Integer.compare(a[1], b[1]));`,
        },
        {
          heading: 'Recognize heap problems',
          paragraphs: [
            'A heap is useful when items arrive over time and the next smallest/largest item is repeatedly needed: Top-K, merge K sorted lists, task scheduling, and streaming medians.',
          ],
          bullets: [
            'Confirm which item the root represents.',
            'State the invariant after every insertion/removal.',
            'Consider ties and duplicate values.',
            'Prefer O(N log K) when K is much smaller than N.',
          ],
        },
      ],
      takeaway: 'Explain the heap invariant and comparator before estimating complexity.',
    },
  ],
  'graphs-dp': [
    {
      title: 'Graph representation and traversal',
      subtitle: 'Visit each vertex and edge without looping forever',
      sections: [
        {
          heading: 'Adjacency lists',
          paragraphs: [
            'For a sparse graph, an adjacency list stores each vertex’s neighbors and uses O(V + E) space. Add both directions for an undirected edge; add only u -> v for a directed edge.',
          ],
          code: `List<List<Integer>> graph = new ArrayList<>();
for (int i = 0; i < vertexCount; i++) {
    graph.add(new ArrayList<>());
}
graph.get(u).add(v);
graph.get(v).add(u); // only for an undirected edge`,
        },
        {
          heading: 'BFS and DFS',
          paragraphs: [
            'BFS explores by distance in an unweighted graph and uses a queue. DFS explores deeply and is useful for components, cycle detection, and ordering. Mark visited when enqueuing in BFS so a vertex is not queued repeatedly.',
          ],
          bullets: [
            'Time with an adjacency list: O(V + E).',
            'For disconnected graphs, start a traversal from every unvisited vertex.',
            'For shortest paths with nonnegative weights, use Dijkstra rather than plain BFS.',
          ],
        },
      ],
      takeaway: 'Choose BFS for unweighted shortest-path distance and DFS for exploration or recursive structure.',
    },
    {
      title: 'Dynamic programming recipe',
      subtitle: 'Cache repeated subproblems and prove each transition',
      sections: [
        {
          heading: 'Four questions to define a DP',
          paragraphs: [
            'Dynamic programming applies when subproblems overlap and an optimal answer can be composed from smaller answers. Define the state before writing the recurrence.',
          ],
          bullets: [
            'State: what does dp[i] mean?',
            'Transition: which earlier states can produce this state?',
            'Base case: what are the smallest known answers?',
            'Evaluation order: top-down memoization or bottom-up tabulation?',
          ],
        },
        {
          heading:           'House Robber: no adjacent choices',
          paragraphs: [
            'Assume the standard nonnegative house amounts. Let dp[i] be the best amount using houses through i. Either skip house i or take its value and skip i - 1: dp[i] = max(dp[i - 1], dp[i - 2] + value[i]). The previous two answers are enough, so space can be reduced to O(1).',
          ],
          code: `long twoBack = 0, oneBack = 0;
for (int money : nums) {
    long current = Math.max(oneBack, twoBack + money);
    twoBack = oneBack;
    oneBack = current;
}
return oneBack;`,
        },
      ],
      takeaway: 'A DP recurrence is trustworthy only after the state and choices are stated in plain language.',
    },
    {
      title: 'Combine graph and DP patterns',
      subtitle: 'Use dependencies, memoization, and test cases deliberately',
      sections: [
        {
          heading: 'Topological order for dependencies',
          paragraphs: [
            'A directed acyclic graph (DAG) can be processed in dependency order. Kahn’s algorithm queues every zero-indegree vertex, removes it, and reduces indegrees of its neighbors. If fewer than V vertices are processed, the graph contains a cycle.',
          ],
          bullets: [
            'Build indegree counts while reading directed edges.',
            'Enqueue all vertices with indegree zero.',
            'Process each edge once and enqueue a neighbor when its count reaches zero.',
            'Time: O(V + E).',
          ],
        },
        {
          heading: 'Choose memoization or tabulation',
          paragraphs: [
            'Memoization starts from the requested state and caches answers on demand; tabulation fills states in a known order. Both avoid recomputing overlapping subproblems, but their stack and iteration behavior differ.',
          ],
          bullets: [
            'Test an empty input, a single state, and a case with multiple competing choices.',
            'For graphs, test a cycle, a disconnected component, and a repeated edge if allowed.',
            'For DP, check base cases and compare the recurrence against a tiny hand-worked input.',
          ],
        },
      ],
      takeaway: 'Separate graph traversal state from DP state, and test both cycles and base cases.',
    },
  ],
};
