/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ 17:
/***/ ((__unused_webpack_module, __unused_webpack___webpack_exports__, __webpack_require__) => {

/* harmony import */ var set_clustering__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(834);
/* harmony import */ var set_clustering__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(set_clustering__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var any_ascii__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(414);


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
  const asciiText = (0,any_ascii__WEBPACK_IMPORTED_MODULE_1__/* ["default"] */ .A)(text);
  const cleanedText = asciiText.replace(/[^a-zA-Z0-9 ]/g, '').toLowerCase();
  const normalizedText = cleanedText.replace(/\s+/g, ' ').trim();
  const tokenizedText = normalizedText.split(' ').filter(word => word.length > 0);
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
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = __webpack_modules__;
/******/ 	
/******/ 	// the startup function
/******/ 	__webpack_require__.x = () => {
/******/ 		// Load entry module and return exports
/******/ 		// This entry module depends on other loaded chunks and execution need to be delayed
/******/ 		var __webpack_exports__ = __webpack_require__.O(undefined, [933], () => (__webpack_require__(17)))
/******/ 		__webpack_exports__ = __webpack_require__.O(__webpack_exports__);
/******/ 		return __webpack_exports__;
/******/ 	};
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/chunk loaded */
/******/ 	(() => {
/******/ 		var deferred = [];
/******/ 		__webpack_require__.O = (result, chunkIds, fn, priority) => {
/******/ 			if(chunkIds) {
/******/ 				priority = priority || 0;
/******/ 				for(var i = deferred.length; i > 0 && deferred[i - 1][2] > priority; i--) deferred[i] = deferred[i - 1];
/******/ 				deferred[i] = [chunkIds, fn, priority];
/******/ 				return;
/******/ 			}
/******/ 			var notFulfilled = Infinity;
/******/ 			for (var i = 0; i < deferred.length; i++) {
/******/ 				var chunkIds = deferred[i][0];
/******/ 				var fn = deferred[i][1];
/******/ 				var priority = deferred[i][2];
/******/ 				var fulfilled = true;
/******/ 				for (var j = 0; j < chunkIds.length; j++) {
/******/ 					if ((priority & 1 === 0 || notFulfilled >= priority) && Object.keys(__webpack_require__.O).every((key) => (__webpack_require__.O[key](chunkIds[j])))) {
/******/ 						chunkIds.splice(j--, 1);
/******/ 					} else {
/******/ 						fulfilled = false;
/******/ 						if(priority < notFulfilled) notFulfilled = priority;
/******/ 					}
/******/ 				}
/******/ 				if(fulfilled) {
/******/ 					deferred.splice(i--, 1)
/******/ 					var r = fn();
/******/ 					if (r !== undefined) result = r;
/******/ 				}
/******/ 			}
/******/ 			return result;
/******/ 		};
/******/ 	})();
/******/ 	
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
/******/ 	/* webpack/runtime/ensure chunk */
/******/ 	(() => {
/******/ 		__webpack_require__.f = {};
/******/ 		// This file contains only the entry chunk.
/******/ 		// The chunk loading function for additional chunks
/******/ 		__webpack_require__.e = (chunkId) => {
/******/ 			return Promise.all(Object.keys(__webpack_require__.f).reduce((promises, key) => {
/******/ 				__webpack_require__.f[key](chunkId, promises);
/******/ 				return promises;
/******/ 			}, []));
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/get javascript chunk filename */
/******/ 	(() => {
/******/ 		// This function allow to reference async chunks and sibling chunks for the entrypoint
/******/ 		__webpack_require__.u = (chunkId) => {
/******/ 			// return url for filenames based on template
/******/ 			return "" + chunkId + ".index.js";
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/publicPath */
/******/ 	(() => {
/******/ 		__webpack_require__.p = "/scripts/extensions/third-party/Extension-DupeFinder/dist/";
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/importScripts chunk loading */
/******/ 	(() => {
/******/ 		// no baseURI
/******/ 		
/******/ 		// object to store loaded chunks
/******/ 		// "1" means "already loaded"
/******/ 		var installedChunks = {
/******/ 			17: 1
/******/ 		};
/******/ 		
/******/ 		// importScripts chunk loading
/******/ 		var installChunk = (data) => {
/******/ 			var chunkIds = data[0];
/******/ 			var moreModules = data[1];
/******/ 			var runtime = data[2];
/******/ 			for(var moduleId in moreModules) {
/******/ 				if(__webpack_require__.o(moreModules, moduleId)) {
/******/ 					__webpack_require__.m[moduleId] = moreModules[moduleId];
/******/ 				}
/******/ 			}
/******/ 			if(runtime) runtime(__webpack_require__);
/******/ 			while(chunkIds.length)
/******/ 				installedChunks[chunkIds.pop()] = 1;
/******/ 			parentChunkLoadingFunction(data);
/******/ 		};
/******/ 		__webpack_require__.f.i = (chunkId, promises) => {
/******/ 			// "1" is the signal for "already loaded"
/******/ 			if(!installedChunks[chunkId]) {
/******/ 				if(true) { // all chunks have JS
/******/ 					importScripts(__webpack_require__.p + __webpack_require__.u(chunkId));
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 		
/******/ 		var chunkLoadingGlobal = self["webpackChunkextension_dupefinder"] = self["webpackChunkextension_dupefinder"] || [];
/******/ 		var parentChunkLoadingFunction = chunkLoadingGlobal.push.bind(chunkLoadingGlobal);
/******/ 		chunkLoadingGlobal.push = installChunk;
/******/ 		
/******/ 		// no HMR
/******/ 		
/******/ 		// no HMR manifest
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/startup chunk dependencies */
/******/ 	(() => {
/******/ 		var next = __webpack_require__.x;
/******/ 		__webpack_require__.x = () => {
/******/ 			return __webpack_require__.e(933).then(next);
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// run startup
/******/ 	var __webpack_exports__ = __webpack_require__.x();
/******/ 	
/******/ })()
;