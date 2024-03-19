/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ 834:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var graph = __webpack_require__(52);

var DEFAULT_SEARCH_DEPTH = 1000;

module.exports = function(set, similarity) {
  function checkedSim(x, y) {
    var sim = similarity(x, y);
    if (typeof sim != 'number' ||
        sim < 0)
      throw new Error('Similarity function did not yield a number in the range [0, +Inf) when comparing ' + x + ' to ' + y + ' : ' + sim);
    return sim;
  }

  var g = graph.create(set, checkedSim);

  function stripNodes(realFunction) {
    return function(/* args */) {
      var nodes = realFunction.apply(this, Array.prototype.slice.call(arguments));
      return nodes.map(graph.data);
    }
  }

  function stripGraphs(realFunction) {
    return function(/* args */) {
      var graphs = realFunction.apply(this, Array.prototype.slice.call(arguments));
      return graphs.map(function(g) {
        return g.nodes.map(graph.data);
      });
    }
  }

  function groups(numGroups, searchDepth_) {
    var searchDepth = searchDepth_ || DEFAULT_SEARCH_DEPTH;
    var subGraphs = graph.divide(g, numGroups, searchDepth);
    return subGraphs;
  }

  function representatives(numGroups, searchDepth_) {
    var subGraphs = groups(numGroups, searchDepth_);

    // Cut down to required size by removing the smallest groups.
    subGraphs.sort(function(x, y) {
      return y.nodes.length - x.nodes.length;
    });
    subGraphs.splice(numGroups);

    var roots = subGraphs.map(graph.findCenter);
    return roots;
  }

  function similarGroups(similarityIndex) {
    var subGraphs = graph.connected(g, similarityIndex);
    return subGraphs;
  }

  function evenGroups(numGroups, searchDepth_) {
    var roots = representatives(numGroups);
    var divisions = graph.growFromNuclei(g, roots);
 
    var groups = divisions.graphs.map(function(g) {
      return g.nodes.map(graph.data);
    });

    while (divisions.orphans.length) {
      var o = graph.data(divisions.orphans.pop());
      groups.sort(function(x, y) { return x.length - y.length; });
      groups[0].push(o);
    }

    return groups;
  }

  return {
    groups: stripGraphs(groups),
    representatives: stripNodes(representatives),
    similarGroups: stripGraphs(similarGroups),
    evenGroups: evenGroups
  };
}


/***/ }),

/***/ 52:
/***/ ((module) => {

/* Graph format:
 * {
 *    nodes: Array of node objects,
 *    edges: 2D lookup table for edge weight between two nodes.
 *           Lookup key is node object id.
 *           No edge value OR edge weight zero means "no edge".
 * }
 *
 * Node object format:
 * {
 *    id: generated unique id.
 *    data: Anything at all.
 * }
 */

function createGraph(nodeData, similarity) {
  var edges = {};
  var counter_id = 1;
  var nodes = nodeData.map(function(d) { return { id: counter_id++, data: d }; });

  nodes.forEach(function(m) {
    edges[m.id] = edges[m.id] || {};
    nodes.forEach(function(n) {
      if (m === n)
        return;
      var s = similarity(m.data, n.data);
      edges[m.id][n.id] = s;
      edges[n.id] = edges[n.id] || {};
      edges[n.id][m.id] = s;
    });
  });

  return {
    nodes: nodes,
    edges: edges
  };
};

function distanceMatrix(graph) {
  var dist = {};
  graph.nodes.forEach(function(n) {
    dist[n.id] = {};
    dist[n.id][n.id] = 0;
  });
  graph.nodes.forEach(function(n) {
    graph.nodes.forEach(function(m) {
      if (n == m)
        return;
      var w = graph.edges[n.id] && graph.edges[n.id][m.id];
      if (w == undefined)
        w = Infinity;
      dist[n.id][m.id] = w;
    });
  });
  graph.nodes.forEach(function(k) {
    graph.nodes.forEach(function(i) {
      graph.nodes.forEach(function(j) {
        var d_ikj = dist[i.id][k.id] + dist[k.id][j.id];
        if (dist[i.id][j.id] > d_ikj)
          dist[i.id][j.id] = d_ikj;
      });
    });
  });
  return dist;
}

function findCenter(graph) {
  var dist = distanceMatrix(graph);
  var minMaxDist = Infinity;
  var n_minMaxDist = null;
  graph.nodes.forEach(function(n) {
    var maxDist = 0;
    graph.nodes.forEach(function(m) {
      var d = dist[n.id][m.id];
      if (d > maxDist)
        maxDist = d;
    });
    if (minMaxDist > maxDist) {
      minMaxDist = maxDist;
      n_minMaxDist = n;
    }
  });
  return n_minMaxDist;
}

function connectedSubgraphs(graph, similarityThreshold) {
  var untouchedNodes = graph.nodes.slice();
  var graphs = [];

  if (!untouchedNodes.length)
    return graphs;
  
  // nodes to try and spread current subgraph from
  var ns = [];
  // current subgraph
  var cur = null;

  while (untouchedNodes.length) {
    // reached end of current subgraph?
    if (!ns.length) {
      if (cur)
        graphs.push(cur);
      ns = [ untouchedNodes.pop() ];
      cur = {
        nodes: ns.slice(),
        edges: {}
      };
    }

    while (ns.length) {
      var n = ns.pop();
      for (var x = untouchedNodes.length - 1; x >= 0; x--) {
        var m = untouchedNodes[x];
        if (graph.edges[n.id] && graph.edges[n.id][m.id] >= similarityThreshold) {
          ns.push(m);
          cur.nodes.push(m);
          cur.edges[n.id] = cur.edges[n.id] || {};
          cur.edges[n.id][m.id] = graph.edges[n.id][m.id];
          cur.edges[m.id] = cur.edges[m.id] || {};
          cur.edges[m.id][n.id] = graph.edges[m.id][n.id];
          var un2 = untouchedNodes.slice(0, x).concat(untouchedNodes.slice(x + 1));
          untouchedNodes = un2;
        }
      }
    };
  }
  
  if (cur)
    graphs.push(cur);

  return graphs;
};

function analyzeSizeDist(sizes) {
  var sum = 0;
  sizes.forEach(function(s) {
    sum += s;
  });
  var mean = sum / sizes.length;
  var balance = 0;
  sizes.forEach(function(s) {
    balance += Math.pow(s - mean, 2);
  });
  return {
    mean: mean,
    stdDev: Math.sqrt(balance)
  };
}

function highestWeight(graph) {
  var hi = 0;
  graph.nodes.forEach(function(n) {
    graph.nodes.forEach(function(m) {
      var w = graph.edges[n.id][m.id];
      if (w && w > hi)
        hi = w;
    });
  });
  return hi;
}

// Divide into n graphs, where n is at least numGraphs, and as close to numGraphs as possible.
function divideInto(graph, numGraphs, attemptDepth) {
  var bestDiff = Infinity;
  var lo = 0;
  var hi = highestWeight(graph) + 1;
  var best = null;
  
  for (var attempts = -2; attempts < attemptDepth; attempts++) {
    var similarity;
    if (attempts == -2)
      similarity = lo;
    else if (attempts == -1)
      similarity = hi;
    else
      similarity = (hi + lo) / 2;

    var c = connectedSubgraphs(graph, similarity);
    
    var diff = c.length - numGraphs;
    if (diff < bestDiff && diff >= 0) {
      bestDiff = diff;
      best = c;
    }

    if (c.length > numGraphs)
      hi = similarity;
    if (c.length < numGraphs)
      lo = similarity;
    
    if (c.length == numGraphs)
      break;

    if (lo == hi)
      break;
  }
  
  return best;
};

function id(x) { return x; }

// Severely suboptimal implementations
function growFromNuclei(graph, nuclei) {
  var subGraphs = nuclei.map(function(n) {
    return {
      nodes: [ n ],
      edges: {}
    };
  });
  var unclaimedNodes = graph.nodes.filter(function(n) {
    // true for graph nodes not in nuclei
    return nuclei.filter(function(m) {
      return n == m;
    }).length == 0;
  });

  var currentGrowGraphIdx = 0;
  var noGrowthDetector = subGraphs.length;
  while (unclaimedNodes.length && noGrowthDetector) {
    noGrowthDetector -= 1;
    var g = subGraphs[currentGrowGraphIdx];
    currentGrowGraphIdx = (currentGrowGraphIdx + 1) % subGraphs.length;
    var closestNeighborN = null;
    var closestNeighborM = null;
    var closestNeighborDist = -Infinity;
    g.nodes.forEach(function(n) {
      unclaimedNodes.forEach(function(m) {
        var d = graph.edges[n.id] && graph.edges[n.id][m.id];
        if (d && d > closestNeighborDist) {
          closestNeighborN = n;
          closestNeighborM = m;
          closestNeighborDist = d;
        }
      });
    });
    if (closestNeighborN) {
      var n = closestNeighborN;
      var m = closestNeighborM;
      g.edges[n.id] = g.edges[n.id] || {};
      g.edges[n.id][m.id] = graph.edges[n.id][m.id];
      g.edges[m.id] = g.edges[m.id] || {};
      g.edges[m.id][n.id] = graph.edges[m.id][n.id];
      g.nodes.push(closestNeighborM);
      unclaimedNodes = unclaimedNodes.filter(function(n) {
        return n != closestNeighborM;
      });
      noGrowthDetector = subGraphs.length;
    }
  }
  return { graphs: subGraphs,
           orphans: unclaimedNodes };
}

function data(node) {
  return node.data;
}

module.exports = {
  create: createGraph,
  data: data,
  connected: connectedSubgraphs,
  divide: divideInto,
  findCenter: findCenter,
  growFromNuclei: growFromNuclei
};


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat get default export */
/******/ 	(() => {
/******/ 		// getDefaultExport function for compatibility with non-harmony modules
/******/ 		__webpack_require__.n = (module) => {
/******/ 			var getter = module && module.__esModule ?
/******/ 				() => (module['default']) :
/******/ 				() => (module);
/******/ 			__webpack_require__.d(getter, { a: getter });
/******/ 			return getter;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be in strict mode.
(() => {
"use strict";
/* harmony import */ var set_clustering__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(834);
/* harmony import */ var set_clustering__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(set_clustering__WEBPACK_IMPORTED_MODULE_0__);

const allowedKeys = new Set(['name', 'description', 'scenario', 'personality', 'first_mes', 'mes_example']);
const cleanAndTokenizeTextCache = new Map();
const similarityCache = new Map();
const generateTextCacheKey = (dateAdded, key) => {
  return "".concat(dateAdded, "-").concat(key);
};
const cleanAndTokenizeText = (text, dateAdded, key) => {
  const cacheKey = generateTextCacheKey(dateAdded, key);
  if (cleanAndTokenizeTextCache.has(cacheKey)) {
    return cleanAndTokenizeTextCache.get(cacheKey);
  }
  const cleanedText = text.replace(/[^a-zA-Z0-9 ]/g, '').toLowerCase();
  const normalizedText = cleanedText.replace(/\s+/g, ' ').trim();
  const tokenizedText = normalizedText.split(/[.?!]+/).map(sentence => sentence.trim()).filter(sentence => sentence.length > 0);
  cleanAndTokenizeTextCache.set(cacheKey, tokenizedText);
  return tokenizedText;
};
const generateCacheKey = (id1, id2) => {
  return id1 < id2 ? "".concat(id1, "-").concat(id2) : "".concat(id2, "-").concat(id1);
};
const similarity = (x, y) => {
  const cacheKey = generateCacheKey(x['date_added'], y['date_added']);
  if (similarityCache.has(cacheKey)) {
    return similarityCache.get(cacheKey);
  }
  let score = 0;
  let matchedKeys = 0;
  for (const key of allowedKeys) {
    const value1 = x.data[key] || '';
    const value2 = y.data[key] || '';
    if (value1 === '' || value2 === '') {
      continue;
    }
    const sentences1 = new Set(cleanAndTokenizeText(value1, x['date_added'], key));
    const sentences2 = new Set(cleanAndTokenizeText(value2, y['date_added'], key));
    const intersection = new Set([...sentences1].filter(s => sentences2.has(s)));
    const totalUniqueSentences = new Set([...sentences1, ...sentences2]);
    if (totalUniqueSentences.size > 0) {
      let similarity = intersection.size / totalUniqueSentences.size;
      score += similarity;
      matchedKeys++;
    }
  }
  let finalScore = matchedKeys === 0 ? 0 : score / matchedKeys;
  similarityCache.set(cacheKey, finalScore);
  return finalScore;
};
self.onmessage = function (_ref) {
  let {
    data: {
      threshold,
      characters
    }
  } = _ref;
  similarityCache.clear();
  cleanAndTokenizeTextCache.clear();
  const totalRuns = characters.length * (characters.length - 1);
  let run = 0;
  let percent = 0;
  const clusters = set_clustering__WEBPACK_IMPORTED_MODULE_0___default()(characters, (x, y) => {
    const newPercent = Math.round(run++ / totalRuns * 100);
    if (newPercent !== percent) {
      percent = newPercent;
      self.postMessage({
        type: 'progress',
        data: {
          percent: newPercent,
          run,
          totalRuns
        }
      });
    }
    return similarity(x, y);
  });
  const groups = clusters.similarGroups(threshold);
  self.postMessage({
    type: 'result',
    data: groups
  });
};
})();

/******/ })()
;