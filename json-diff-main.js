import { r as regenerator } from "./index.js";
import { I as IdleScheduler } from "./idle-scheduler.js";
var diffMatchPatch = { exports: {} };
(function(module) {
  var diff_match_patch2 = function() {
    this.Diff_Timeout = 1;
    this.Diff_EditCost = 4;
    this.Match_Threshold = 0.5;
    this.Match_Distance = 1e3;
    this.Patch_DeleteThreshold = 0.5;
    this.Patch_Margin = 4;
    this.Match_MaxBits = 32;
  };
  var DIFF_DELETE = -1;
  var DIFF_INSERT = 1;
  var DIFF_EQUAL = 0;
  diff_match_patch2.Diff = function(op, text) {
    return [op, text];
  };
  diff_match_patch2.prototype.diff_main = function(text1, text2, opt_checklines, opt_deadline) {
    if (typeof opt_deadline == "undefined") {
      if (this.Diff_Timeout <= 0) {
        opt_deadline = Number.MAX_VALUE;
      } else {
        opt_deadline = new Date().getTime() + this.Diff_Timeout * 1e3;
      }
    }
    var deadline = opt_deadline;
    if (text1 == null || text2 == null) {
      throw new Error("Null input. (diff_main)");
    }
    if (text1 == text2) {
      if (text1) {
        return [new diff_match_patch2.Diff(DIFF_EQUAL, text1)];
      }
      return [];
    }
    if (typeof opt_checklines == "undefined") {
      opt_checklines = true;
    }
    var checklines = opt_checklines;
    var commonlength = this.diff_commonPrefix(text1, text2);
    var commonprefix = text1.substring(0, commonlength);
    text1 = text1.substring(commonlength);
    text2 = text2.substring(commonlength);
    commonlength = this.diff_commonSuffix(text1, text2);
    var commonsuffix = text1.substring(text1.length - commonlength);
    text1 = text1.substring(0, text1.length - commonlength);
    text2 = text2.substring(0, text2.length - commonlength);
    var diffs = this.diff_compute_(text1, text2, checklines, deadline);
    if (commonprefix) {
      diffs.unshift(new diff_match_patch2.Diff(DIFF_EQUAL, commonprefix));
    }
    if (commonsuffix) {
      diffs.push(new diff_match_patch2.Diff(DIFF_EQUAL, commonsuffix));
    }
    this.diff_cleanupMerge(diffs);
    return diffs;
  };
  diff_match_patch2.prototype.diff_compute_ = function(text1, text2, checklines, deadline) {
    var diffs;
    if (!text1) {
      return [new diff_match_patch2.Diff(DIFF_INSERT, text2)];
    }
    if (!text2) {
      return [new diff_match_patch2.Diff(DIFF_DELETE, text1)];
    }
    var longtext = text1.length > text2.length ? text1 : text2;
    var shorttext = text1.length > text2.length ? text2 : text1;
    var i = longtext.indexOf(shorttext);
    if (i != -1) {
      diffs = [
        new diff_match_patch2.Diff(DIFF_INSERT, longtext.substring(0, i)),
        new diff_match_patch2.Diff(DIFF_EQUAL, shorttext),
        new diff_match_patch2.Diff(
          DIFF_INSERT,
          longtext.substring(i + shorttext.length)
        )
      ];
      if (text1.length > text2.length) {
        diffs[0][0] = diffs[2][0] = DIFF_DELETE;
      }
      return diffs;
    }
    if (shorttext.length == 1) {
      return [
        new diff_match_patch2.Diff(DIFF_DELETE, text1),
        new diff_match_patch2.Diff(DIFF_INSERT, text2)
      ];
    }
    var hm = this.diff_halfMatch_(text1, text2);
    if (hm) {
      var text1_a = hm[0];
      var text1_b = hm[1];
      var text2_a = hm[2];
      var text2_b = hm[3];
      var mid_common = hm[4];
      var diffs_a = this.diff_main(text1_a, text2_a, checklines, deadline);
      var diffs_b = this.diff_main(text1_b, text2_b, checklines, deadline);
      return diffs_a.concat(
        [new diff_match_patch2.Diff(DIFF_EQUAL, mid_common)],
        diffs_b
      );
    }
    if (checklines && text1.length > 100 && text2.length > 100) {
      return this.diff_lineMode_(text1, text2, deadline);
    }
    return this.diff_bisect_(text1, text2, deadline);
  };
  diff_match_patch2.prototype.diff_lineMode_ = function(text1, text2, deadline) {
    var a = this.diff_linesToChars_(text1, text2);
    text1 = a.chars1;
    text2 = a.chars2;
    var linearray = a.lineArray;
    var diffs = this.diff_main(text1, text2, false, deadline);
    this.diff_charsToLines_(diffs, linearray);
    this.diff_cleanupSemantic(diffs);
    diffs.push(new diff_match_patch2.Diff(DIFF_EQUAL, ""));
    var pointer = 0;
    var count_delete = 0;
    var count_insert = 0;
    var text_delete = "";
    var text_insert = "";
    while (pointer < diffs.length) {
      switch (diffs[pointer][0]) {
        case DIFF_INSERT:
          count_insert++;
          text_insert += diffs[pointer][1];
          break;
        case DIFF_DELETE:
          count_delete++;
          text_delete += diffs[pointer][1];
          break;
        case DIFF_EQUAL:
          if (count_delete >= 1 && count_insert >= 1) {
            diffs.splice(
              pointer - count_delete - count_insert,
              count_delete + count_insert
            );
            pointer = pointer - count_delete - count_insert;
            var subDiff = this.diff_main(text_delete, text_insert, false, deadline);
            for (var j = subDiff.length - 1; j >= 0; j--) {
              diffs.splice(pointer, 0, subDiff[j]);
            }
            pointer = pointer + subDiff.length;
          }
          count_insert = 0;
          count_delete = 0;
          text_delete = "";
          text_insert = "";
          break;
      }
      pointer++;
    }
    diffs.pop();
    return diffs;
  };
  diff_match_patch2.prototype.diff_bisect_ = function(text1, text2, deadline) {
    var text1_length = text1.length;
    var text2_length = text2.length;
    var max_d = Math.ceil((text1_length + text2_length) / 2);
    var v_offset = max_d;
    var v_length = 2 * max_d;
    var v1 = new Array(v_length);
    var v2 = new Array(v_length);
    for (var x = 0; x < v_length; x++) {
      v1[x] = -1;
      v2[x] = -1;
    }
    v1[v_offset + 1] = 0;
    v2[v_offset + 1] = 0;
    var delta = text1_length - text2_length;
    var front = delta % 2 != 0;
    var k1start = 0;
    var k1end = 0;
    var k2start = 0;
    var k2end = 0;
    for (var d = 0; d < max_d; d++) {
      if (new Date().getTime() > deadline) {
        break;
      }
      for (var k1 = -d + k1start; k1 <= d - k1end; k1 += 2) {
        var k1_offset = v_offset + k1;
        var x1;
        if (k1 == -d || k1 != d && v1[k1_offset - 1] < v1[k1_offset + 1]) {
          x1 = v1[k1_offset + 1];
        } else {
          x1 = v1[k1_offset - 1] + 1;
        }
        var y1 = x1 - k1;
        while (x1 < text1_length && y1 < text2_length && text1.charAt(x1) == text2.charAt(y1)) {
          x1++;
          y1++;
        }
        v1[k1_offset] = x1;
        if (x1 > text1_length) {
          k1end += 2;
        } else if (y1 > text2_length) {
          k1start += 2;
        } else if (front) {
          var k2_offset = v_offset + delta - k1;
          if (k2_offset >= 0 && k2_offset < v_length && v2[k2_offset] != -1) {
            var x2 = text1_length - v2[k2_offset];
            if (x1 >= x2) {
              return this.diff_bisectSplit_(text1, text2, x1, y1, deadline);
            }
          }
        }
      }
      for (var k2 = -d + k2start; k2 <= d - k2end; k2 += 2) {
        var k2_offset = v_offset + k2;
        var x2;
        if (k2 == -d || k2 != d && v2[k2_offset - 1] < v2[k2_offset + 1]) {
          x2 = v2[k2_offset + 1];
        } else {
          x2 = v2[k2_offset - 1] + 1;
        }
        var y2 = x2 - k2;
        while (x2 < text1_length && y2 < text2_length && text1.charAt(text1_length - x2 - 1) == text2.charAt(text2_length - y2 - 1)) {
          x2++;
          y2++;
        }
        v2[k2_offset] = x2;
        if (x2 > text1_length) {
          k2end += 2;
        } else if (y2 > text2_length) {
          k2start += 2;
        } else if (!front) {
          var k1_offset = v_offset + delta - k2;
          if (k1_offset >= 0 && k1_offset < v_length && v1[k1_offset] != -1) {
            var x1 = v1[k1_offset];
            var y1 = v_offset + x1 - k1_offset;
            x2 = text1_length - x2;
            if (x1 >= x2) {
              return this.diff_bisectSplit_(text1, text2, x1, y1, deadline);
            }
          }
        }
      }
    }
    return [
      new diff_match_patch2.Diff(DIFF_DELETE, text1),
      new diff_match_patch2.Diff(DIFF_INSERT, text2)
    ];
  };
  diff_match_patch2.prototype.diff_bisectSplit_ = function(text1, text2, x, y, deadline) {
    var text1a = text1.substring(0, x);
    var text2a = text2.substring(0, y);
    var text1b = text1.substring(x);
    var text2b = text2.substring(y);
    var diffs = this.diff_main(text1a, text2a, false, deadline);
    var diffsb = this.diff_main(text1b, text2b, false, deadline);
    return diffs.concat(diffsb);
  };
  diff_match_patch2.prototype.diff_linesToChars_ = function(text1, text2) {
    var lineArray = [];
    var lineHash = {};
    lineArray[0] = "";
    function diff_linesToCharsMunge_(text) {
      var chars = "";
      var lineStart = 0;
      var lineEnd = -1;
      var lineArrayLength = lineArray.length;
      while (lineEnd < text.length - 1) {
        lineEnd = text.indexOf("\n", lineStart);
        if (lineEnd == -1) {
          lineEnd = text.length - 1;
        }
        var line = text.substring(lineStart, lineEnd + 1);
        if (lineHash.hasOwnProperty ? lineHash.hasOwnProperty(line) : lineHash[line] !== void 0) {
          chars += String.fromCharCode(lineHash[line]);
        } else {
          if (lineArrayLength == maxLines) {
            line = text.substring(lineStart);
            lineEnd = text.length;
          }
          chars += String.fromCharCode(lineArrayLength);
          lineHash[line] = lineArrayLength;
          lineArray[lineArrayLength++] = line;
        }
        lineStart = lineEnd + 1;
      }
      return chars;
    }
    var maxLines = 4e4;
    var chars1 = diff_linesToCharsMunge_(text1);
    maxLines = 65535;
    var chars2 = diff_linesToCharsMunge_(text2);
    return { chars1, chars2, lineArray };
  };
  diff_match_patch2.prototype.diff_charsToLines_ = function(diffs, lineArray) {
    for (var i = 0; i < diffs.length; i++) {
      var chars = diffs[i][1];
      var text = [];
      for (var j = 0; j < chars.length; j++) {
        text[j] = lineArray[chars.charCodeAt(j)];
      }
      diffs[i][1] = text.join("");
    }
  };
  diff_match_patch2.prototype.diff_commonPrefix = function(text1, text2) {
    if (!text1 || !text2 || text1.charAt(0) != text2.charAt(0)) {
      return 0;
    }
    var pointermin = 0;
    var pointermax = Math.min(text1.length, text2.length);
    var pointermid = pointermax;
    var pointerstart = 0;
    while (pointermin < pointermid) {
      if (text1.substring(pointerstart, pointermid) == text2.substring(pointerstart, pointermid)) {
        pointermin = pointermid;
        pointerstart = pointermin;
      } else {
        pointermax = pointermid;
      }
      pointermid = Math.floor((pointermax - pointermin) / 2 + pointermin);
    }
    return pointermid;
  };
  diff_match_patch2.prototype.diff_commonSuffix = function(text1, text2) {
    if (!text1 || !text2 || text1.charAt(text1.length - 1) != text2.charAt(text2.length - 1)) {
      return 0;
    }
    var pointermin = 0;
    var pointermax = Math.min(text1.length, text2.length);
    var pointermid = pointermax;
    var pointerend = 0;
    while (pointermin < pointermid) {
      if (text1.substring(text1.length - pointermid, text1.length - pointerend) == text2.substring(text2.length - pointermid, text2.length - pointerend)) {
        pointermin = pointermid;
        pointerend = pointermin;
      } else {
        pointermax = pointermid;
      }
      pointermid = Math.floor((pointermax - pointermin) / 2 + pointermin);
    }
    return pointermid;
  };
  diff_match_patch2.prototype.diff_commonOverlap_ = function(text1, text2) {
    var text1_length = text1.length;
    var text2_length = text2.length;
    if (text1_length == 0 || text2_length == 0) {
      return 0;
    }
    if (text1_length > text2_length) {
      text1 = text1.substring(text1_length - text2_length);
    } else if (text1_length < text2_length) {
      text2 = text2.substring(0, text1_length);
    }
    var text_length = Math.min(text1_length, text2_length);
    if (text1 == text2) {
      return text_length;
    }
    var best = 0;
    var length = 1;
    while (true) {
      var pattern = text1.substring(text_length - length);
      var found = text2.indexOf(pattern);
      if (found == -1) {
        return best;
      }
      length += found;
      if (found == 0 || text1.substring(text_length - length) == text2.substring(0, length)) {
        best = length;
        length++;
      }
    }
  };
  diff_match_patch2.prototype.diff_halfMatch_ = function(text1, text2) {
    if (this.Diff_Timeout <= 0) {
      return null;
    }
    var longtext = text1.length > text2.length ? text1 : text2;
    var shorttext = text1.length > text2.length ? text2 : text1;
    if (longtext.length < 4 || shorttext.length * 2 < longtext.length) {
      return null;
    }
    var dmp2 = this;
    function diff_halfMatchI_(longtext2, shorttext2, i) {
      var seed = longtext2.substring(i, i + Math.floor(longtext2.length / 4));
      var j = -1;
      var best_common = "";
      var best_longtext_a, best_longtext_b, best_shorttext_a, best_shorttext_b;
      while ((j = shorttext2.indexOf(seed, j + 1)) != -1) {
        var prefixLength = dmp2.diff_commonPrefix(
          longtext2.substring(i),
          shorttext2.substring(j)
        );
        var suffixLength = dmp2.diff_commonSuffix(
          longtext2.substring(0, i),
          shorttext2.substring(0, j)
        );
        if (best_common.length < suffixLength + prefixLength) {
          best_common = shorttext2.substring(j - suffixLength, j) + shorttext2.substring(j, j + prefixLength);
          best_longtext_a = longtext2.substring(0, i - suffixLength);
          best_longtext_b = longtext2.substring(i + prefixLength);
          best_shorttext_a = shorttext2.substring(0, j - suffixLength);
          best_shorttext_b = shorttext2.substring(j + prefixLength);
        }
      }
      if (best_common.length * 2 >= longtext2.length) {
        return [
          best_longtext_a,
          best_longtext_b,
          best_shorttext_a,
          best_shorttext_b,
          best_common
        ];
      } else {
        return null;
      }
    }
    var hm1 = diff_halfMatchI_(
      longtext,
      shorttext,
      Math.ceil(longtext.length / 4)
    );
    var hm2 = diff_halfMatchI_(
      longtext,
      shorttext,
      Math.ceil(longtext.length / 2)
    );
    var hm;
    if (!hm1 && !hm2) {
      return null;
    } else if (!hm2) {
      hm = hm1;
    } else if (!hm1) {
      hm = hm2;
    } else {
      hm = hm1[4].length > hm2[4].length ? hm1 : hm2;
    }
    var text1_a, text1_b, text2_a, text2_b;
    if (text1.length > text2.length) {
      text1_a = hm[0];
      text1_b = hm[1];
      text2_a = hm[2];
      text2_b = hm[3];
    } else {
      text2_a = hm[0];
      text2_b = hm[1];
      text1_a = hm[2];
      text1_b = hm[3];
    }
    var mid_common = hm[4];
    return [text1_a, text1_b, text2_a, text2_b, mid_common];
  };
  diff_match_patch2.prototype.diff_cleanupSemantic = function(diffs) {
    var changes = false;
    var equalities = [];
    var equalitiesLength = 0;
    var lastEquality = null;
    var pointer = 0;
    var length_insertions1 = 0;
    var length_deletions1 = 0;
    var length_insertions2 = 0;
    var length_deletions2 = 0;
    while (pointer < diffs.length) {
      if (diffs[pointer][0] == DIFF_EQUAL) {
        equalities[equalitiesLength++] = pointer;
        length_insertions1 = length_insertions2;
        length_deletions1 = length_deletions2;
        length_insertions2 = 0;
        length_deletions2 = 0;
        lastEquality = diffs[pointer][1];
      } else {
        if (diffs[pointer][0] == DIFF_INSERT) {
          length_insertions2 += diffs[pointer][1].length;
        } else {
          length_deletions2 += diffs[pointer][1].length;
        }
        if (lastEquality && lastEquality.length <= Math.max(length_insertions1, length_deletions1) && lastEquality.length <= Math.max(
          length_insertions2,
          length_deletions2
        )) {
          diffs.splice(
            equalities[equalitiesLength - 1],
            0,
            new diff_match_patch2.Diff(DIFF_DELETE, lastEquality)
          );
          diffs[equalities[equalitiesLength - 1] + 1][0] = DIFF_INSERT;
          equalitiesLength--;
          equalitiesLength--;
          pointer = equalitiesLength > 0 ? equalities[equalitiesLength - 1] : -1;
          length_insertions1 = 0;
          length_deletions1 = 0;
          length_insertions2 = 0;
          length_deletions2 = 0;
          lastEquality = null;
          changes = true;
        }
      }
      pointer++;
    }
    if (changes) {
      this.diff_cleanupMerge(diffs);
    }
    this.diff_cleanupSemanticLossless(diffs);
    pointer = 1;
    while (pointer < diffs.length) {
      if (diffs[pointer - 1][0] == DIFF_DELETE && diffs[pointer][0] == DIFF_INSERT) {
        var deletion = diffs[pointer - 1][1];
        var insertion = diffs[pointer][1];
        var overlap_length1 = this.diff_commonOverlap_(deletion, insertion);
        var overlap_length2 = this.diff_commonOverlap_(insertion, deletion);
        if (overlap_length1 >= overlap_length2) {
          if (overlap_length1 >= deletion.length / 2 || overlap_length1 >= insertion.length / 2) {
            diffs.splice(pointer, 0, new diff_match_patch2.Diff(
              DIFF_EQUAL,
              insertion.substring(0, overlap_length1)
            ));
            diffs[pointer - 1][1] = deletion.substring(0, deletion.length - overlap_length1);
            diffs[pointer + 1][1] = insertion.substring(overlap_length1);
            pointer++;
          }
        } else {
          if (overlap_length2 >= deletion.length / 2 || overlap_length2 >= insertion.length / 2) {
            diffs.splice(pointer, 0, new diff_match_patch2.Diff(
              DIFF_EQUAL,
              deletion.substring(0, overlap_length2)
            ));
            diffs[pointer - 1][0] = DIFF_INSERT;
            diffs[pointer - 1][1] = insertion.substring(0, insertion.length - overlap_length2);
            diffs[pointer + 1][0] = DIFF_DELETE;
            diffs[pointer + 1][1] = deletion.substring(overlap_length2);
            pointer++;
          }
        }
        pointer++;
      }
      pointer++;
    }
  };
  diff_match_patch2.prototype.diff_cleanupSemanticLossless = function(diffs) {
    function diff_cleanupSemanticScore_(one, two) {
      if (!one || !two) {
        return 6;
      }
      var char1 = one.charAt(one.length - 1);
      var char2 = two.charAt(0);
      var nonAlphaNumeric1 = char1.match(diff_match_patch2.nonAlphaNumericRegex_);
      var nonAlphaNumeric2 = char2.match(diff_match_patch2.nonAlphaNumericRegex_);
      var whitespace1 = nonAlphaNumeric1 && char1.match(diff_match_patch2.whitespaceRegex_);
      var whitespace2 = nonAlphaNumeric2 && char2.match(diff_match_patch2.whitespaceRegex_);
      var lineBreak1 = whitespace1 && char1.match(diff_match_patch2.linebreakRegex_);
      var lineBreak2 = whitespace2 && char2.match(diff_match_patch2.linebreakRegex_);
      var blankLine1 = lineBreak1 && one.match(diff_match_patch2.blanklineEndRegex_);
      var blankLine2 = lineBreak2 && two.match(diff_match_patch2.blanklineStartRegex_);
      if (blankLine1 || blankLine2) {
        return 5;
      } else if (lineBreak1 || lineBreak2) {
        return 4;
      } else if (nonAlphaNumeric1 && !whitespace1 && whitespace2) {
        return 3;
      } else if (whitespace1 || whitespace2) {
        return 2;
      } else if (nonAlphaNumeric1 || nonAlphaNumeric2) {
        return 1;
      }
      return 0;
    }
    var pointer = 1;
    while (pointer < diffs.length - 1) {
      if (diffs[pointer - 1][0] == DIFF_EQUAL && diffs[pointer + 1][0] == DIFF_EQUAL) {
        var equality1 = diffs[pointer - 1][1];
        var edit = diffs[pointer][1];
        var equality2 = diffs[pointer + 1][1];
        var commonOffset = this.diff_commonSuffix(equality1, edit);
        if (commonOffset) {
          var commonString = edit.substring(edit.length - commonOffset);
          equality1 = equality1.substring(0, equality1.length - commonOffset);
          edit = commonString + edit.substring(0, edit.length - commonOffset);
          equality2 = commonString + equality2;
        }
        var bestEquality1 = equality1;
        var bestEdit = edit;
        var bestEquality2 = equality2;
        var bestScore = diff_cleanupSemanticScore_(equality1, edit) + diff_cleanupSemanticScore_(edit, equality2);
        while (edit.charAt(0) === equality2.charAt(0)) {
          equality1 += edit.charAt(0);
          edit = edit.substring(1) + equality2.charAt(0);
          equality2 = equality2.substring(1);
          var score = diff_cleanupSemanticScore_(equality1, edit) + diff_cleanupSemanticScore_(edit, equality2);
          if (score >= bestScore) {
            bestScore = score;
            bestEquality1 = equality1;
            bestEdit = edit;
            bestEquality2 = equality2;
          }
        }
        if (diffs[pointer - 1][1] != bestEquality1) {
          if (bestEquality1) {
            diffs[pointer - 1][1] = bestEquality1;
          } else {
            diffs.splice(pointer - 1, 1);
            pointer--;
          }
          diffs[pointer][1] = bestEdit;
          if (bestEquality2) {
            diffs[pointer + 1][1] = bestEquality2;
          } else {
            diffs.splice(pointer + 1, 1);
            pointer--;
          }
        }
      }
      pointer++;
    }
  };
  diff_match_patch2.nonAlphaNumericRegex_ = /[^a-zA-Z0-9]/;
  diff_match_patch2.whitespaceRegex_ = /\s/;
  diff_match_patch2.linebreakRegex_ = /[\r\n]/;
  diff_match_patch2.blanklineEndRegex_ = /\n\r?\n$/;
  diff_match_patch2.blanklineStartRegex_ = /^\r?\n\r?\n/;
  diff_match_patch2.prototype.diff_cleanupEfficiency = function(diffs) {
    var changes = false;
    var equalities = [];
    var equalitiesLength = 0;
    var lastEquality = null;
    var pointer = 0;
    var pre_ins = false;
    var pre_del = false;
    var post_ins = false;
    var post_del = false;
    while (pointer < diffs.length) {
      if (diffs[pointer][0] == DIFF_EQUAL) {
        if (diffs[pointer][1].length < this.Diff_EditCost && (post_ins || post_del)) {
          equalities[equalitiesLength++] = pointer;
          pre_ins = post_ins;
          pre_del = post_del;
          lastEquality = diffs[pointer][1];
        } else {
          equalitiesLength = 0;
          lastEquality = null;
        }
        post_ins = post_del = false;
      } else {
        if (diffs[pointer][0] == DIFF_DELETE) {
          post_del = true;
        } else {
          post_ins = true;
        }
        if (lastEquality && (pre_ins && pre_del && post_ins && post_del || lastEquality.length < this.Diff_EditCost / 2 && pre_ins + pre_del + post_ins + post_del == 3)) {
          diffs.splice(
            equalities[equalitiesLength - 1],
            0,
            new diff_match_patch2.Diff(DIFF_DELETE, lastEquality)
          );
          diffs[equalities[equalitiesLength - 1] + 1][0] = DIFF_INSERT;
          equalitiesLength--;
          lastEquality = null;
          if (pre_ins && pre_del) {
            post_ins = post_del = true;
            equalitiesLength = 0;
          } else {
            equalitiesLength--;
            pointer = equalitiesLength > 0 ? equalities[equalitiesLength - 1] : -1;
            post_ins = post_del = false;
          }
          changes = true;
        }
      }
      pointer++;
    }
    if (changes) {
      this.diff_cleanupMerge(diffs);
    }
  };
  diff_match_patch2.prototype.diff_cleanupMerge = function(diffs) {
    diffs.push(new diff_match_patch2.Diff(DIFF_EQUAL, ""));
    var pointer = 0;
    var count_delete = 0;
    var count_insert = 0;
    var text_delete = "";
    var text_insert = "";
    var commonlength;
    while (pointer < diffs.length) {
      switch (diffs[pointer][0]) {
        case DIFF_INSERT:
          count_insert++;
          text_insert += diffs[pointer][1];
          pointer++;
          break;
        case DIFF_DELETE:
          count_delete++;
          text_delete += diffs[pointer][1];
          pointer++;
          break;
        case DIFF_EQUAL:
          if (count_delete + count_insert > 1) {
            if (count_delete !== 0 && count_insert !== 0) {
              commonlength = this.diff_commonPrefix(text_insert, text_delete);
              if (commonlength !== 0) {
                if (pointer - count_delete - count_insert > 0 && diffs[pointer - count_delete - count_insert - 1][0] == DIFF_EQUAL) {
                  diffs[pointer - count_delete - count_insert - 1][1] += text_insert.substring(0, commonlength);
                } else {
                  diffs.splice(0, 0, new diff_match_patch2.Diff(
                    DIFF_EQUAL,
                    text_insert.substring(0, commonlength)
                  ));
                  pointer++;
                }
                text_insert = text_insert.substring(commonlength);
                text_delete = text_delete.substring(commonlength);
              }
              commonlength = this.diff_commonSuffix(text_insert, text_delete);
              if (commonlength !== 0) {
                diffs[pointer][1] = text_insert.substring(text_insert.length - commonlength) + diffs[pointer][1];
                text_insert = text_insert.substring(0, text_insert.length - commonlength);
                text_delete = text_delete.substring(0, text_delete.length - commonlength);
              }
            }
            pointer -= count_delete + count_insert;
            diffs.splice(pointer, count_delete + count_insert);
            if (text_delete.length) {
              diffs.splice(
                pointer,
                0,
                new diff_match_patch2.Diff(DIFF_DELETE, text_delete)
              );
              pointer++;
            }
            if (text_insert.length) {
              diffs.splice(
                pointer,
                0,
                new diff_match_patch2.Diff(DIFF_INSERT, text_insert)
              );
              pointer++;
            }
            pointer++;
          } else if (pointer !== 0 && diffs[pointer - 1][0] == DIFF_EQUAL) {
            diffs[pointer - 1][1] += diffs[pointer][1];
            diffs.splice(pointer, 1);
          } else {
            pointer++;
          }
          count_insert = 0;
          count_delete = 0;
          text_delete = "";
          text_insert = "";
          break;
      }
    }
    if (diffs[diffs.length - 1][1] === "") {
      diffs.pop();
    }
    var changes = false;
    pointer = 1;
    while (pointer < diffs.length - 1) {
      if (diffs[pointer - 1][0] == DIFF_EQUAL && diffs[pointer + 1][0] == DIFF_EQUAL) {
        if (diffs[pointer][1].substring(diffs[pointer][1].length - diffs[pointer - 1][1].length) == diffs[pointer - 1][1]) {
          diffs[pointer][1] = diffs[pointer - 1][1] + diffs[pointer][1].substring(0, diffs[pointer][1].length - diffs[pointer - 1][1].length);
          diffs[pointer + 1][1] = diffs[pointer - 1][1] + diffs[pointer + 1][1];
          diffs.splice(pointer - 1, 1);
          changes = true;
        } else if (diffs[pointer][1].substring(0, diffs[pointer + 1][1].length) == diffs[pointer + 1][1]) {
          diffs[pointer - 1][1] += diffs[pointer + 1][1];
          diffs[pointer][1] = diffs[pointer][1].substring(diffs[pointer + 1][1].length) + diffs[pointer + 1][1];
          diffs.splice(pointer + 1, 1);
          changes = true;
        }
      }
      pointer++;
    }
    if (changes) {
      this.diff_cleanupMerge(diffs);
    }
  };
  diff_match_patch2.prototype.diff_xIndex = function(diffs, loc) {
    var chars1 = 0;
    var chars2 = 0;
    var last_chars1 = 0;
    var last_chars2 = 0;
    var x;
    for (x = 0; x < diffs.length; x++) {
      if (diffs[x][0] !== DIFF_INSERT) {
        chars1 += diffs[x][1].length;
      }
      if (diffs[x][0] !== DIFF_DELETE) {
        chars2 += diffs[x][1].length;
      }
      if (chars1 > loc) {
        break;
      }
      last_chars1 = chars1;
      last_chars2 = chars2;
    }
    if (diffs.length != x && diffs[x][0] === DIFF_DELETE) {
      return last_chars2;
    }
    return last_chars2 + (loc - last_chars1);
  };
  diff_match_patch2.prototype.diff_prettyHtml = function(diffs) {
    var html2 = [];
    var pattern_amp = /&/g;
    var pattern_lt = /</g;
    var pattern_gt = />/g;
    var pattern_para = /\n/g;
    for (var x = 0; x < diffs.length; x++) {
      var op = diffs[x][0];
      var data = diffs[x][1];
      var text = data.replace(pattern_amp, "&amp;").replace(pattern_lt, "&lt;").replace(pattern_gt, "&gt;").replace(pattern_para, "&para;<br>");
      switch (op) {
        case DIFF_INSERT:
          html2[x] = '<ins style="background:#e6ffe6;">' + text + "</ins>";
          break;
        case DIFF_DELETE:
          html2[x] = '<del style="background:#ffe6e6;">' + text + "</del>";
          break;
        case DIFF_EQUAL:
          html2[x] = "<span>" + text + "</span>";
          break;
      }
    }
    return html2.join("");
  };
  diff_match_patch2.prototype.diff_text1 = function(diffs) {
    var text = [];
    for (var x = 0; x < diffs.length; x++) {
      if (diffs[x][0] !== DIFF_INSERT) {
        text[x] = diffs[x][1];
      }
    }
    return text.join("");
  };
  diff_match_patch2.prototype.diff_text2 = function(diffs) {
    var text = [];
    for (var x = 0; x < diffs.length; x++) {
      if (diffs[x][0] !== DIFF_DELETE) {
        text[x] = diffs[x][1];
      }
    }
    return text.join("");
  };
  diff_match_patch2.prototype.diff_levenshtein = function(diffs) {
    var levenshtein = 0;
    var insertions = 0;
    var deletions = 0;
    for (var x = 0; x < diffs.length; x++) {
      var op = diffs[x][0];
      var data = diffs[x][1];
      switch (op) {
        case DIFF_INSERT:
          insertions += data.length;
          break;
        case DIFF_DELETE:
          deletions += data.length;
          break;
        case DIFF_EQUAL:
          levenshtein += Math.max(insertions, deletions);
          insertions = 0;
          deletions = 0;
          break;
      }
    }
    levenshtein += Math.max(insertions, deletions);
    return levenshtein;
  };
  diff_match_patch2.prototype.diff_toDelta = function(diffs) {
    var text = [];
    for (var x = 0; x < diffs.length; x++) {
      switch (diffs[x][0]) {
        case DIFF_INSERT:
          text[x] = "+" + encodeURI(diffs[x][1]);
          break;
        case DIFF_DELETE:
          text[x] = "-" + diffs[x][1].length;
          break;
        case DIFF_EQUAL:
          text[x] = "=" + diffs[x][1].length;
          break;
      }
    }
    return text.join("	").replace(/%20/g, " ");
  };
  diff_match_patch2.prototype.diff_fromDelta = function(text1, delta) {
    var diffs = [];
    var diffsLength = 0;
    var pointer = 0;
    var tokens = delta.split(/\t/g);
    for (var x = 0; x < tokens.length; x++) {
      var param = tokens[x].substring(1);
      switch (tokens[x].charAt(0)) {
        case "+":
          try {
            diffs[diffsLength++] = new diff_match_patch2.Diff(DIFF_INSERT, decodeURI(param));
          } catch (ex) {
            throw new Error("Illegal escape in diff_fromDelta: " + param);
          }
          break;
        case "-":
        case "=":
          var n = parseInt(param, 10);
          if (isNaN(n) || n < 0) {
            throw new Error("Invalid number in diff_fromDelta: " + param);
          }
          var text = text1.substring(pointer, pointer += n);
          if (tokens[x].charAt(0) == "=") {
            diffs[diffsLength++] = new diff_match_patch2.Diff(DIFF_EQUAL, text);
          } else {
            diffs[diffsLength++] = new diff_match_patch2.Diff(DIFF_DELETE, text);
          }
          break;
        default:
          if (tokens[x]) {
            throw new Error("Invalid diff operation in diff_fromDelta: " + tokens[x]);
          }
      }
    }
    if (pointer != text1.length) {
      throw new Error("Delta length (" + pointer + ") does not equal source text length (" + text1.length + ").");
    }
    return diffs;
  };
  diff_match_patch2.prototype.match_main = function(text, pattern, loc) {
    if (text == null || pattern == null || loc == null) {
      throw new Error("Null input. (match_main)");
    }
    loc = Math.max(0, Math.min(loc, text.length));
    if (text == pattern) {
      return 0;
    } else if (!text.length) {
      return -1;
    } else if (text.substring(loc, loc + pattern.length) == pattern) {
      return loc;
    } else {
      return this.match_bitap_(text, pattern, loc);
    }
  };
  diff_match_patch2.prototype.match_bitap_ = function(text, pattern, loc) {
    if (pattern.length > this.Match_MaxBits) {
      throw new Error("Pattern too long for this browser.");
    }
    var s = this.match_alphabet_(pattern);
    var dmp2 = this;
    function match_bitapScore_(e, x) {
      var accuracy = e / pattern.length;
      var proximity = Math.abs(loc - x);
      if (!dmp2.Match_Distance) {
        return proximity ? 1 : accuracy;
      }
      return accuracy + proximity / dmp2.Match_Distance;
    }
    var score_threshold = this.Match_Threshold;
    var best_loc = text.indexOf(pattern, loc);
    if (best_loc != -1) {
      score_threshold = Math.min(match_bitapScore_(0, best_loc), score_threshold);
      best_loc = text.lastIndexOf(pattern, loc + pattern.length);
      if (best_loc != -1) {
        score_threshold = Math.min(match_bitapScore_(0, best_loc), score_threshold);
      }
    }
    var matchmask = 1 << pattern.length - 1;
    best_loc = -1;
    var bin_min, bin_mid;
    var bin_max = pattern.length + text.length;
    var last_rd;
    for (var d = 0; d < pattern.length; d++) {
      bin_min = 0;
      bin_mid = bin_max;
      while (bin_min < bin_mid) {
        if (match_bitapScore_(d, loc + bin_mid) <= score_threshold) {
          bin_min = bin_mid;
        } else {
          bin_max = bin_mid;
        }
        bin_mid = Math.floor((bin_max - bin_min) / 2 + bin_min);
      }
      bin_max = bin_mid;
      var start = Math.max(1, loc - bin_mid + 1);
      var finish = Math.min(loc + bin_mid, text.length) + pattern.length;
      var rd = Array(finish + 2);
      rd[finish + 1] = (1 << d) - 1;
      for (var j = finish; j >= start; j--) {
        var charMatch = s[text.charAt(j - 1)];
        if (d === 0) {
          rd[j] = (rd[j + 1] << 1 | 1) & charMatch;
        } else {
          rd[j] = (rd[j + 1] << 1 | 1) & charMatch | ((last_rd[j + 1] | last_rd[j]) << 1 | 1) | last_rd[j + 1];
        }
        if (rd[j] & matchmask) {
          var score = match_bitapScore_(d, j - 1);
          if (score <= score_threshold) {
            score_threshold = score;
            best_loc = j - 1;
            if (best_loc > loc) {
              start = Math.max(1, 2 * loc - best_loc);
            } else {
              break;
            }
          }
        }
      }
      if (match_bitapScore_(d + 1, loc) > score_threshold) {
        break;
      }
      last_rd = rd;
    }
    return best_loc;
  };
  diff_match_patch2.prototype.match_alphabet_ = function(pattern) {
    var s = {};
    for (var i = 0; i < pattern.length; i++) {
      s[pattern.charAt(i)] = 0;
    }
    for (var i = 0; i < pattern.length; i++) {
      s[pattern.charAt(i)] |= 1 << pattern.length - i - 1;
    }
    return s;
  };
  diff_match_patch2.prototype.patch_addContext_ = function(patch, text) {
    if (text.length == 0) {
      return;
    }
    if (patch.start2 === null) {
      throw Error("patch not initialized");
    }
    var pattern = text.substring(patch.start2, patch.start2 + patch.length1);
    var padding = 0;
    while (text.indexOf(pattern) != text.lastIndexOf(pattern) && pattern.length < this.Match_MaxBits - this.Patch_Margin - this.Patch_Margin) {
      padding += this.Patch_Margin;
      pattern = text.substring(
        patch.start2 - padding,
        patch.start2 + patch.length1 + padding
      );
    }
    padding += this.Patch_Margin;
    var prefix = text.substring(patch.start2 - padding, patch.start2);
    if (prefix) {
      patch.diffs.unshift(new diff_match_patch2.Diff(DIFF_EQUAL, prefix));
    }
    var suffix = text.substring(
      patch.start2 + patch.length1,
      patch.start2 + patch.length1 + padding
    );
    if (suffix) {
      patch.diffs.push(new diff_match_patch2.Diff(DIFF_EQUAL, suffix));
    }
    patch.start1 -= prefix.length;
    patch.start2 -= prefix.length;
    patch.length1 += prefix.length + suffix.length;
    patch.length2 += prefix.length + suffix.length;
  };
  diff_match_patch2.prototype.patch_make = function(a, opt_b, opt_c) {
    var text1, diffs;
    if (typeof a == "string" && typeof opt_b == "string" && typeof opt_c == "undefined") {
      text1 = a;
      diffs = this.diff_main(text1, opt_b, true);
      if (diffs.length > 2) {
        this.diff_cleanupSemantic(diffs);
        this.diff_cleanupEfficiency(diffs);
      }
    } else if (a && typeof a == "object" && typeof opt_b == "undefined" && typeof opt_c == "undefined") {
      diffs = a;
      text1 = this.diff_text1(diffs);
    } else if (typeof a == "string" && opt_b && typeof opt_b == "object" && typeof opt_c == "undefined") {
      text1 = a;
      diffs = opt_b;
    } else if (typeof a == "string" && typeof opt_b == "string" && opt_c && typeof opt_c == "object") {
      text1 = a;
      diffs = opt_c;
    } else {
      throw new Error("Unknown call format to patch_make.");
    }
    if (diffs.length === 0) {
      return [];
    }
    var patches = [];
    var patch = new diff_match_patch2.patch_obj();
    var patchDiffLength = 0;
    var char_count1 = 0;
    var char_count2 = 0;
    var prepatch_text = text1;
    var postpatch_text = text1;
    for (var x = 0; x < diffs.length; x++) {
      var diff_type = diffs[x][0];
      var diff_text = diffs[x][1];
      if (!patchDiffLength && diff_type !== DIFF_EQUAL) {
        patch.start1 = char_count1;
        patch.start2 = char_count2;
      }
      switch (diff_type) {
        case DIFF_INSERT:
          patch.diffs[patchDiffLength++] = diffs[x];
          patch.length2 += diff_text.length;
          postpatch_text = postpatch_text.substring(0, char_count2) + diff_text + postpatch_text.substring(char_count2);
          break;
        case DIFF_DELETE:
          patch.length1 += diff_text.length;
          patch.diffs[patchDiffLength++] = diffs[x];
          postpatch_text = postpatch_text.substring(0, char_count2) + postpatch_text.substring(char_count2 + diff_text.length);
          break;
        case DIFF_EQUAL:
          if (diff_text.length <= 2 * this.Patch_Margin && patchDiffLength && diffs.length != x + 1) {
            patch.diffs[patchDiffLength++] = diffs[x];
            patch.length1 += diff_text.length;
            patch.length2 += diff_text.length;
          } else if (diff_text.length >= 2 * this.Patch_Margin) {
            if (patchDiffLength) {
              this.patch_addContext_(patch, prepatch_text);
              patches.push(patch);
              patch = new diff_match_patch2.patch_obj();
              patchDiffLength = 0;
              prepatch_text = postpatch_text;
              char_count1 = char_count2;
            }
          }
          break;
      }
      if (diff_type !== DIFF_INSERT) {
        char_count1 += diff_text.length;
      }
      if (diff_type !== DIFF_DELETE) {
        char_count2 += diff_text.length;
      }
    }
    if (patchDiffLength) {
      this.patch_addContext_(patch, prepatch_text);
      patches.push(patch);
    }
    return patches;
  };
  diff_match_patch2.prototype.patch_deepCopy = function(patches) {
    var patchesCopy = [];
    for (var x = 0; x < patches.length; x++) {
      var patch = patches[x];
      var patchCopy = new diff_match_patch2.patch_obj();
      patchCopy.diffs = [];
      for (var y = 0; y < patch.diffs.length; y++) {
        patchCopy.diffs[y] = new diff_match_patch2.Diff(patch.diffs[y][0], patch.diffs[y][1]);
      }
      patchCopy.start1 = patch.start1;
      patchCopy.start2 = patch.start2;
      patchCopy.length1 = patch.length1;
      patchCopy.length2 = patch.length2;
      patchesCopy[x] = patchCopy;
    }
    return patchesCopy;
  };
  diff_match_patch2.prototype.patch_apply = function(patches, text) {
    if (patches.length == 0) {
      return [text, []];
    }
    patches = this.patch_deepCopy(patches);
    var nullPadding = this.patch_addPadding(patches);
    text = nullPadding + text + nullPadding;
    this.patch_splitMax(patches);
    var delta = 0;
    var results = [];
    for (var x = 0; x < patches.length; x++) {
      var expected_loc = patches[x].start2 + delta;
      var text1 = this.diff_text1(patches[x].diffs);
      var start_loc;
      var end_loc = -1;
      if (text1.length > this.Match_MaxBits) {
        start_loc = this.match_main(
          text,
          text1.substring(0, this.Match_MaxBits),
          expected_loc
        );
        if (start_loc != -1) {
          end_loc = this.match_main(
            text,
            text1.substring(text1.length - this.Match_MaxBits),
            expected_loc + text1.length - this.Match_MaxBits
          );
          if (end_loc == -1 || start_loc >= end_loc) {
            start_loc = -1;
          }
        }
      } else {
        start_loc = this.match_main(text, text1, expected_loc);
      }
      if (start_loc == -1) {
        results[x] = false;
        delta -= patches[x].length2 - patches[x].length1;
      } else {
        results[x] = true;
        delta = start_loc - expected_loc;
        var text2;
        if (end_loc == -1) {
          text2 = text.substring(start_loc, start_loc + text1.length);
        } else {
          text2 = text.substring(start_loc, end_loc + this.Match_MaxBits);
        }
        if (text1 == text2) {
          text = text.substring(0, start_loc) + this.diff_text2(patches[x].diffs) + text.substring(start_loc + text1.length);
        } else {
          var diffs = this.diff_main(text1, text2, false);
          if (text1.length > this.Match_MaxBits && this.diff_levenshtein(diffs) / text1.length > this.Patch_DeleteThreshold) {
            results[x] = false;
          } else {
            this.diff_cleanupSemanticLossless(diffs);
            var index1 = 0;
            var index2;
            for (var y = 0; y < patches[x].diffs.length; y++) {
              var mod = patches[x].diffs[y];
              if (mod[0] !== DIFF_EQUAL) {
                index2 = this.diff_xIndex(diffs, index1);
              }
              if (mod[0] === DIFF_INSERT) {
                text = text.substring(0, start_loc + index2) + mod[1] + text.substring(start_loc + index2);
              } else if (mod[0] === DIFF_DELETE) {
                text = text.substring(0, start_loc + index2) + text.substring(start_loc + this.diff_xIndex(
                  diffs,
                  index1 + mod[1].length
                ));
              }
              if (mod[0] !== DIFF_DELETE) {
                index1 += mod[1].length;
              }
            }
          }
        }
      }
    }
    text = text.substring(nullPadding.length, text.length - nullPadding.length);
    return [text, results];
  };
  diff_match_patch2.prototype.patch_addPadding = function(patches) {
    var paddingLength = this.Patch_Margin;
    var nullPadding = "";
    for (var x = 1; x <= paddingLength; x++) {
      nullPadding += String.fromCharCode(x);
    }
    for (var x = 0; x < patches.length; x++) {
      patches[x].start1 += paddingLength;
      patches[x].start2 += paddingLength;
    }
    var patch = patches[0];
    var diffs = patch.diffs;
    if (diffs.length == 0 || diffs[0][0] != DIFF_EQUAL) {
      diffs.unshift(new diff_match_patch2.Diff(DIFF_EQUAL, nullPadding));
      patch.start1 -= paddingLength;
      patch.start2 -= paddingLength;
      patch.length1 += paddingLength;
      patch.length2 += paddingLength;
    } else if (paddingLength > diffs[0][1].length) {
      var extraLength = paddingLength - diffs[0][1].length;
      diffs[0][1] = nullPadding.substring(diffs[0][1].length) + diffs[0][1];
      patch.start1 -= extraLength;
      patch.start2 -= extraLength;
      patch.length1 += extraLength;
      patch.length2 += extraLength;
    }
    patch = patches[patches.length - 1];
    diffs = patch.diffs;
    if (diffs.length == 0 || diffs[diffs.length - 1][0] != DIFF_EQUAL) {
      diffs.push(new diff_match_patch2.Diff(DIFF_EQUAL, nullPadding));
      patch.length1 += paddingLength;
      patch.length2 += paddingLength;
    } else if (paddingLength > diffs[diffs.length - 1][1].length) {
      var extraLength = paddingLength - diffs[diffs.length - 1][1].length;
      diffs[diffs.length - 1][1] += nullPadding.substring(0, extraLength);
      patch.length1 += extraLength;
      patch.length2 += extraLength;
    }
    return nullPadding;
  };
  diff_match_patch2.prototype.patch_splitMax = function(patches) {
    var patch_size = this.Match_MaxBits;
    for (var x = 0; x < patches.length; x++) {
      if (patches[x].length1 <= patch_size) {
        continue;
      }
      var bigpatch = patches[x];
      patches.splice(x--, 1);
      var start1 = bigpatch.start1;
      var start2 = bigpatch.start2;
      var precontext = "";
      while (bigpatch.diffs.length !== 0) {
        var patch = new diff_match_patch2.patch_obj();
        var empty = true;
        patch.start1 = start1 - precontext.length;
        patch.start2 = start2 - precontext.length;
        if (precontext !== "") {
          patch.length1 = patch.length2 = precontext.length;
          patch.diffs.push(new diff_match_patch2.Diff(DIFF_EQUAL, precontext));
        }
        while (bigpatch.diffs.length !== 0 && patch.length1 < patch_size - this.Patch_Margin) {
          var diff_type = bigpatch.diffs[0][0];
          var diff_text = bigpatch.diffs[0][1];
          if (diff_type === DIFF_INSERT) {
            patch.length2 += diff_text.length;
            start2 += diff_text.length;
            patch.diffs.push(bigpatch.diffs.shift());
            empty = false;
          } else if (diff_type === DIFF_DELETE && patch.diffs.length == 1 && patch.diffs[0][0] == DIFF_EQUAL && diff_text.length > 2 * patch_size) {
            patch.length1 += diff_text.length;
            start1 += diff_text.length;
            empty = false;
            patch.diffs.push(new diff_match_patch2.Diff(diff_type, diff_text));
            bigpatch.diffs.shift();
          } else {
            diff_text = diff_text.substring(
              0,
              patch_size - patch.length1 - this.Patch_Margin
            );
            patch.length1 += diff_text.length;
            start1 += diff_text.length;
            if (diff_type === DIFF_EQUAL) {
              patch.length2 += diff_text.length;
              start2 += diff_text.length;
            } else {
              empty = false;
            }
            patch.diffs.push(new diff_match_patch2.Diff(diff_type, diff_text));
            if (diff_text == bigpatch.diffs[0][1]) {
              bigpatch.diffs.shift();
            } else {
              bigpatch.diffs[0][1] = bigpatch.diffs[0][1].substring(diff_text.length);
            }
          }
        }
        precontext = this.diff_text2(patch.diffs);
        precontext = precontext.substring(precontext.length - this.Patch_Margin);
        var postcontext = this.diff_text1(bigpatch.diffs).substring(0, this.Patch_Margin);
        if (postcontext !== "") {
          patch.length1 += postcontext.length;
          patch.length2 += postcontext.length;
          if (patch.diffs.length !== 0 && patch.diffs[patch.diffs.length - 1][0] === DIFF_EQUAL) {
            patch.diffs[patch.diffs.length - 1][1] += postcontext;
          } else {
            patch.diffs.push(new diff_match_patch2.Diff(DIFF_EQUAL, postcontext));
          }
        }
        if (!empty) {
          patches.splice(++x, 0, patch);
        }
      }
    }
  };
  diff_match_patch2.prototype.patch_toText = function(patches) {
    var text = [];
    for (var x = 0; x < patches.length; x++) {
      text[x] = patches[x];
    }
    return text.join("");
  };
  diff_match_patch2.prototype.patch_fromText = function(textline) {
    var patches = [];
    if (!textline) {
      return patches;
    }
    var text = textline.split("\n");
    var textPointer = 0;
    var patchHeader = /^@@ -(\d+),?(\d*) \+(\d+),?(\d*) @@$/;
    while (textPointer < text.length) {
      var m = text[textPointer].match(patchHeader);
      if (!m) {
        throw new Error("Invalid patch string: " + text[textPointer]);
      }
      var patch = new diff_match_patch2.patch_obj();
      patches.push(patch);
      patch.start1 = parseInt(m[1], 10);
      if (m[2] === "") {
        patch.start1--;
        patch.length1 = 1;
      } else if (m[2] == "0") {
        patch.length1 = 0;
      } else {
        patch.start1--;
        patch.length1 = parseInt(m[2], 10);
      }
      patch.start2 = parseInt(m[3], 10);
      if (m[4] === "") {
        patch.start2--;
        patch.length2 = 1;
      } else if (m[4] == "0") {
        patch.length2 = 0;
      } else {
        patch.start2--;
        patch.length2 = parseInt(m[4], 10);
      }
      textPointer++;
      while (textPointer < text.length) {
        var sign = text[textPointer].charAt(0);
        try {
          var line = decodeURI(text[textPointer].substring(1));
        } catch (ex) {
          throw new Error("Illegal escape in patch_fromText: " + line);
        }
        if (sign == "-") {
          patch.diffs.push(new diff_match_patch2.Diff(DIFF_DELETE, line));
        } else if (sign == "+") {
          patch.diffs.push(new diff_match_patch2.Diff(DIFF_INSERT, line));
        } else if (sign == " ") {
          patch.diffs.push(new diff_match_patch2.Diff(DIFF_EQUAL, line));
        } else if (sign == "@") {
          break;
        } else if (sign === "")
          ;
        else {
          throw new Error('Invalid patch mode "' + sign + '" in: ' + line);
        }
        textPointer++;
      }
    }
    return patches;
  };
  diff_match_patch2.patch_obj = function() {
    this.diffs = [];
    this.start1 = null;
    this.start2 = null;
    this.length1 = 0;
    this.length2 = 0;
  };
  diff_match_patch2.patch_obj.prototype.toString = function() {
    var coords1, coords2;
    if (this.length1 === 0) {
      coords1 = this.start1 + ",0";
    } else if (this.length1 == 1) {
      coords1 = this.start1 + 1;
    } else {
      coords1 = this.start1 + 1 + "," + this.length1;
    }
    if (this.length2 === 0) {
      coords2 = this.start2 + ",0";
    } else if (this.length2 == 1) {
      coords2 = this.start2 + 1;
    } else {
      coords2 = this.start2 + 1 + "," + this.length2;
    }
    var text = ["@@ -" + coords1 + " +" + coords2 + " @@\n"];
    var op;
    for (var x = 0; x < this.diffs.length; x++) {
      switch (this.diffs[x][0]) {
        case DIFF_INSERT:
          op = "+";
          break;
        case DIFF_DELETE:
          op = "-";
          break;
        case DIFF_EQUAL:
          op = " ";
          break;
      }
      text[x + 1] = op + encodeURI(this.diffs[x][1]) + "\n";
    }
    return text.join("").replace(/%20/g, " ");
  };
  module.exports = diff_match_patch2;
  module.exports["diff_match_patch"] = diff_match_patch2;
  module.exports["DIFF_DELETE"] = DIFF_DELETE;
  module.exports["DIFF_INSERT"] = DIFF_INSERT;
  module.exports["DIFF_EQUAL"] = DIFF_EQUAL;
})(diffMatchPatch);
var dmp = diffMatchPatch.exports;
var chalk$1 = { exports: {} };
var matchOperatorsRe = /[|\\{}()[\]^$+*?.]/g;
var escapeStringRegexp = function(str) {
  if (typeof str !== "string") {
    throw new TypeError("Expected a string");
  }
  return str.replace(matchOperatorsRe, "\\$&");
};
var ansiStyles = { exports: {} };
var conversions$2 = { exports: {} };
var colorName = {
  "aliceblue": [240, 248, 255],
  "antiquewhite": [250, 235, 215],
  "aqua": [0, 255, 255],
  "aquamarine": [127, 255, 212],
  "azure": [240, 255, 255],
  "beige": [245, 245, 220],
  "bisque": [255, 228, 196],
  "black": [0, 0, 0],
  "blanchedalmond": [255, 235, 205],
  "blue": [0, 0, 255],
  "blueviolet": [138, 43, 226],
  "brown": [165, 42, 42],
  "burlywood": [222, 184, 135],
  "cadetblue": [95, 158, 160],
  "chartreuse": [127, 255, 0],
  "chocolate": [210, 105, 30],
  "coral": [255, 127, 80],
  "cornflowerblue": [100, 149, 237],
  "cornsilk": [255, 248, 220],
  "crimson": [220, 20, 60],
  "cyan": [0, 255, 255],
  "darkblue": [0, 0, 139],
  "darkcyan": [0, 139, 139],
  "darkgoldenrod": [184, 134, 11],
  "darkgray": [169, 169, 169],
  "darkgreen": [0, 100, 0],
  "darkgrey": [169, 169, 169],
  "darkkhaki": [189, 183, 107],
  "darkmagenta": [139, 0, 139],
  "darkolivegreen": [85, 107, 47],
  "darkorange": [255, 140, 0],
  "darkorchid": [153, 50, 204],
  "darkred": [139, 0, 0],
  "darksalmon": [233, 150, 122],
  "darkseagreen": [143, 188, 143],
  "darkslateblue": [72, 61, 139],
  "darkslategray": [47, 79, 79],
  "darkslategrey": [47, 79, 79],
  "darkturquoise": [0, 206, 209],
  "darkviolet": [148, 0, 211],
  "deeppink": [255, 20, 147],
  "deepskyblue": [0, 191, 255],
  "dimgray": [105, 105, 105],
  "dimgrey": [105, 105, 105],
  "dodgerblue": [30, 144, 255],
  "firebrick": [178, 34, 34],
  "floralwhite": [255, 250, 240],
  "forestgreen": [34, 139, 34],
  "fuchsia": [255, 0, 255],
  "gainsboro": [220, 220, 220],
  "ghostwhite": [248, 248, 255],
  "gold": [255, 215, 0],
  "goldenrod": [218, 165, 32],
  "gray": [128, 128, 128],
  "green": [0, 128, 0],
  "greenyellow": [173, 255, 47],
  "grey": [128, 128, 128],
  "honeydew": [240, 255, 240],
  "hotpink": [255, 105, 180],
  "indianred": [205, 92, 92],
  "indigo": [75, 0, 130],
  "ivory": [255, 255, 240],
  "khaki": [240, 230, 140],
  "lavender": [230, 230, 250],
  "lavenderblush": [255, 240, 245],
  "lawngreen": [124, 252, 0],
  "lemonchiffon": [255, 250, 205],
  "lightblue": [173, 216, 230],
  "lightcoral": [240, 128, 128],
  "lightcyan": [224, 255, 255],
  "lightgoldenrodyellow": [250, 250, 210],
  "lightgray": [211, 211, 211],
  "lightgreen": [144, 238, 144],
  "lightgrey": [211, 211, 211],
  "lightpink": [255, 182, 193],
  "lightsalmon": [255, 160, 122],
  "lightseagreen": [32, 178, 170],
  "lightskyblue": [135, 206, 250],
  "lightslategray": [119, 136, 153],
  "lightslategrey": [119, 136, 153],
  "lightsteelblue": [176, 196, 222],
  "lightyellow": [255, 255, 224],
  "lime": [0, 255, 0],
  "limegreen": [50, 205, 50],
  "linen": [250, 240, 230],
  "magenta": [255, 0, 255],
  "maroon": [128, 0, 0],
  "mediumaquamarine": [102, 205, 170],
  "mediumblue": [0, 0, 205],
  "mediumorchid": [186, 85, 211],
  "mediumpurple": [147, 112, 219],
  "mediumseagreen": [60, 179, 113],
  "mediumslateblue": [123, 104, 238],
  "mediumspringgreen": [0, 250, 154],
  "mediumturquoise": [72, 209, 204],
  "mediumvioletred": [199, 21, 133],
  "midnightblue": [25, 25, 112],
  "mintcream": [245, 255, 250],
  "mistyrose": [255, 228, 225],
  "moccasin": [255, 228, 181],
  "navajowhite": [255, 222, 173],
  "navy": [0, 0, 128],
  "oldlace": [253, 245, 230],
  "olive": [128, 128, 0],
  "olivedrab": [107, 142, 35],
  "orange": [255, 165, 0],
  "orangered": [255, 69, 0],
  "orchid": [218, 112, 214],
  "palegoldenrod": [238, 232, 170],
  "palegreen": [152, 251, 152],
  "paleturquoise": [175, 238, 238],
  "palevioletred": [219, 112, 147],
  "papayawhip": [255, 239, 213],
  "peachpuff": [255, 218, 185],
  "peru": [205, 133, 63],
  "pink": [255, 192, 203],
  "plum": [221, 160, 221],
  "powderblue": [176, 224, 230],
  "purple": [128, 0, 128],
  "rebeccapurple": [102, 51, 153],
  "red": [255, 0, 0],
  "rosybrown": [188, 143, 143],
  "royalblue": [65, 105, 225],
  "saddlebrown": [139, 69, 19],
  "salmon": [250, 128, 114],
  "sandybrown": [244, 164, 96],
  "seagreen": [46, 139, 87],
  "seashell": [255, 245, 238],
  "sienna": [160, 82, 45],
  "silver": [192, 192, 192],
  "skyblue": [135, 206, 235],
  "slateblue": [106, 90, 205],
  "slategray": [112, 128, 144],
  "slategrey": [112, 128, 144],
  "snow": [255, 250, 250],
  "springgreen": [0, 255, 127],
  "steelblue": [70, 130, 180],
  "tan": [210, 180, 140],
  "teal": [0, 128, 128],
  "thistle": [216, 191, 216],
  "tomato": [255, 99, 71],
  "turquoise": [64, 224, 208],
  "violet": [238, 130, 238],
  "wheat": [245, 222, 179],
  "white": [255, 255, 255],
  "whitesmoke": [245, 245, 245],
  "yellow": [255, 255, 0],
  "yellowgreen": [154, 205, 50]
};
var cssKeywords = colorName;
var reverseKeywords = {};
for (var key in cssKeywords) {
  if (cssKeywords.hasOwnProperty(key)) {
    reverseKeywords[cssKeywords[key]] = key;
  }
}
var convert$1 = conversions$2.exports = {
  rgb: { channels: 3, labels: "rgb" },
  hsl: { channels: 3, labels: "hsl" },
  hsv: { channels: 3, labels: "hsv" },
  hwb: { channels: 3, labels: "hwb" },
  cmyk: { channels: 4, labels: "cmyk" },
  xyz: { channels: 3, labels: "xyz" },
  lab: { channels: 3, labels: "lab" },
  lch: { channels: 3, labels: "lch" },
  hex: { channels: 1, labels: ["hex"] },
  keyword: { channels: 1, labels: ["keyword"] },
  ansi16: { channels: 1, labels: ["ansi16"] },
  ansi256: { channels: 1, labels: ["ansi256"] },
  hcg: { channels: 3, labels: ["h", "c", "g"] },
  apple: { channels: 3, labels: ["r16", "g16", "b16"] },
  gray: { channels: 1, labels: ["gray"] }
};
for (var model in convert$1) {
  if (convert$1.hasOwnProperty(model)) {
    if (!("channels" in convert$1[model])) {
      throw new Error("missing channels property: " + model);
    }
    if (!("labels" in convert$1[model])) {
      throw new Error("missing channel labels property: " + model);
    }
    if (convert$1[model].labels.length !== convert$1[model].channels) {
      throw new Error("channel and label counts mismatch: " + model);
    }
    var channels = convert$1[model].channels;
    var labels = convert$1[model].labels;
    delete convert$1[model].channels;
    delete convert$1[model].labels;
    Object.defineProperty(convert$1[model], "channels", { value: channels });
    Object.defineProperty(convert$1[model], "labels", { value: labels });
  }
}
convert$1.rgb.hsl = function(rgb) {
  var r = rgb[0] / 255;
  var g = rgb[1] / 255;
  var b = rgb[2] / 255;
  var min = Math.min(r, g, b);
  var max = Math.max(r, g, b);
  var delta = max - min;
  var h;
  var s;
  var l;
  if (max === min) {
    h = 0;
  } else if (r === max) {
    h = (g - b) / delta;
  } else if (g === max) {
    h = 2 + (b - r) / delta;
  } else if (b === max) {
    h = 4 + (r - g) / delta;
  }
  h = Math.min(h * 60, 360);
  if (h < 0) {
    h += 360;
  }
  l = (min + max) / 2;
  if (max === min) {
    s = 0;
  } else if (l <= 0.5) {
    s = delta / (max + min);
  } else {
    s = delta / (2 - max - min);
  }
  return [h, s * 100, l * 100];
};
convert$1.rgb.hsv = function(rgb) {
  var rdif;
  var gdif;
  var bdif;
  var h;
  var s;
  var r = rgb[0] / 255;
  var g = rgb[1] / 255;
  var b = rgb[2] / 255;
  var v = Math.max(r, g, b);
  var diff = v - Math.min(r, g, b);
  var diffc = function(c) {
    return (v - c) / 6 / diff + 1 / 2;
  };
  if (diff === 0) {
    h = s = 0;
  } else {
    s = diff / v;
    rdif = diffc(r);
    gdif = diffc(g);
    bdif = diffc(b);
    if (r === v) {
      h = bdif - gdif;
    } else if (g === v) {
      h = 1 / 3 + rdif - bdif;
    } else if (b === v) {
      h = 2 / 3 + gdif - rdif;
    }
    if (h < 0) {
      h += 1;
    } else if (h > 1) {
      h -= 1;
    }
  }
  return [
    h * 360,
    s * 100,
    v * 100
  ];
};
convert$1.rgb.hwb = function(rgb) {
  var r = rgb[0];
  var g = rgb[1];
  var b = rgb[2];
  var h = convert$1.rgb.hsl(rgb)[0];
  var w = 1 / 255 * Math.min(r, Math.min(g, b));
  b = 1 - 1 / 255 * Math.max(r, Math.max(g, b));
  return [h, w * 100, b * 100];
};
convert$1.rgb.cmyk = function(rgb) {
  var r = rgb[0] / 255;
  var g = rgb[1] / 255;
  var b = rgb[2] / 255;
  var c;
  var m;
  var y;
  var k;
  k = Math.min(1 - r, 1 - g, 1 - b);
  c = (1 - r - k) / (1 - k) || 0;
  m = (1 - g - k) / (1 - k) || 0;
  y = (1 - b - k) / (1 - k) || 0;
  return [c * 100, m * 100, y * 100, k * 100];
};
function comparativeDistance(x, y) {
  return Math.pow(x[0] - y[0], 2) + Math.pow(x[1] - y[1], 2) + Math.pow(x[2] - y[2], 2);
}
convert$1.rgb.keyword = function(rgb) {
  var reversed = reverseKeywords[rgb];
  if (reversed) {
    return reversed;
  }
  var currentClosestDistance = Infinity;
  var currentClosestKeyword;
  for (var keyword in cssKeywords) {
    if (cssKeywords.hasOwnProperty(keyword)) {
      var value = cssKeywords[keyword];
      var distance = comparativeDistance(rgb, value);
      if (distance < currentClosestDistance) {
        currentClosestDistance = distance;
        currentClosestKeyword = keyword;
      }
    }
  }
  return currentClosestKeyword;
};
convert$1.keyword.rgb = function(keyword) {
  return cssKeywords[keyword];
};
convert$1.rgb.xyz = function(rgb) {
  var r = rgb[0] / 255;
  var g = rgb[1] / 255;
  var b = rgb[2] / 255;
  r = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
  g = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
  b = b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;
  var x = r * 0.4124 + g * 0.3576 + b * 0.1805;
  var y = r * 0.2126 + g * 0.7152 + b * 0.0722;
  var z = r * 0.0193 + g * 0.1192 + b * 0.9505;
  return [x * 100, y * 100, z * 100];
};
convert$1.rgb.lab = function(rgb) {
  var xyz = convert$1.rgb.xyz(rgb);
  var x = xyz[0];
  var y = xyz[1];
  var z = xyz[2];
  var l;
  var a;
  var b;
  x /= 95.047;
  y /= 100;
  z /= 108.883;
  x = x > 8856e-6 ? Math.pow(x, 1 / 3) : 7.787 * x + 16 / 116;
  y = y > 8856e-6 ? Math.pow(y, 1 / 3) : 7.787 * y + 16 / 116;
  z = z > 8856e-6 ? Math.pow(z, 1 / 3) : 7.787 * z + 16 / 116;
  l = 116 * y - 16;
  a = 500 * (x - y);
  b = 200 * (y - z);
  return [l, a, b];
};
convert$1.hsl.rgb = function(hsl) {
  var h = hsl[0] / 360;
  var s = hsl[1] / 100;
  var l = hsl[2] / 100;
  var t1;
  var t2;
  var t3;
  var rgb;
  var val;
  if (s === 0) {
    val = l * 255;
    return [val, val, val];
  }
  if (l < 0.5) {
    t2 = l * (1 + s);
  } else {
    t2 = l + s - l * s;
  }
  t1 = 2 * l - t2;
  rgb = [0, 0, 0];
  for (var i = 0; i < 3; i++) {
    t3 = h + 1 / 3 * -(i - 1);
    if (t3 < 0) {
      t3++;
    }
    if (t3 > 1) {
      t3--;
    }
    if (6 * t3 < 1) {
      val = t1 + (t2 - t1) * 6 * t3;
    } else if (2 * t3 < 1) {
      val = t2;
    } else if (3 * t3 < 2) {
      val = t1 + (t2 - t1) * (2 / 3 - t3) * 6;
    } else {
      val = t1;
    }
    rgb[i] = val * 255;
  }
  return rgb;
};
convert$1.hsl.hsv = function(hsl) {
  var h = hsl[0];
  var s = hsl[1] / 100;
  var l = hsl[2] / 100;
  var smin = s;
  var lmin = Math.max(l, 0.01);
  var sv;
  var v;
  l *= 2;
  s *= l <= 1 ? l : 2 - l;
  smin *= lmin <= 1 ? lmin : 2 - lmin;
  v = (l + s) / 2;
  sv = l === 0 ? 2 * smin / (lmin + smin) : 2 * s / (l + s);
  return [h, sv * 100, v * 100];
};
convert$1.hsv.rgb = function(hsv) {
  var h = hsv[0] / 60;
  var s = hsv[1] / 100;
  var v = hsv[2] / 100;
  var hi = Math.floor(h) % 6;
  var f = h - Math.floor(h);
  var p = 255 * v * (1 - s);
  var q = 255 * v * (1 - s * f);
  var t = 255 * v * (1 - s * (1 - f));
  v *= 255;
  switch (hi) {
    case 0:
      return [v, t, p];
    case 1:
      return [q, v, p];
    case 2:
      return [p, v, t];
    case 3:
      return [p, q, v];
    case 4:
      return [t, p, v];
    case 5:
      return [v, p, q];
  }
};
convert$1.hsv.hsl = function(hsv) {
  var h = hsv[0];
  var s = hsv[1] / 100;
  var v = hsv[2] / 100;
  var vmin = Math.max(v, 0.01);
  var lmin;
  var sl;
  var l;
  l = (2 - s) * v;
  lmin = (2 - s) * vmin;
  sl = s * vmin;
  sl /= lmin <= 1 ? lmin : 2 - lmin;
  sl = sl || 0;
  l /= 2;
  return [h, sl * 100, l * 100];
};
convert$1.hwb.rgb = function(hwb) {
  var h = hwb[0] / 360;
  var wh = hwb[1] / 100;
  var bl = hwb[2] / 100;
  var ratio = wh + bl;
  var i;
  var v;
  var f;
  var n;
  if (ratio > 1) {
    wh /= ratio;
    bl /= ratio;
  }
  i = Math.floor(6 * h);
  v = 1 - bl;
  f = 6 * h - i;
  if ((i & 1) !== 0) {
    f = 1 - f;
  }
  n = wh + f * (v - wh);
  var r;
  var g;
  var b;
  switch (i) {
    default:
    case 6:
    case 0:
      r = v;
      g = n;
      b = wh;
      break;
    case 1:
      r = n;
      g = v;
      b = wh;
      break;
    case 2:
      r = wh;
      g = v;
      b = n;
      break;
    case 3:
      r = wh;
      g = n;
      b = v;
      break;
    case 4:
      r = n;
      g = wh;
      b = v;
      break;
    case 5:
      r = v;
      g = wh;
      b = n;
      break;
  }
  return [r * 255, g * 255, b * 255];
};
convert$1.cmyk.rgb = function(cmyk) {
  var c = cmyk[0] / 100;
  var m = cmyk[1] / 100;
  var y = cmyk[2] / 100;
  var k = cmyk[3] / 100;
  var r;
  var g;
  var b;
  r = 1 - Math.min(1, c * (1 - k) + k);
  g = 1 - Math.min(1, m * (1 - k) + k);
  b = 1 - Math.min(1, y * (1 - k) + k);
  return [r * 255, g * 255, b * 255];
};
convert$1.xyz.rgb = function(xyz) {
  var x = xyz[0] / 100;
  var y = xyz[1] / 100;
  var z = xyz[2] / 100;
  var r;
  var g;
  var b;
  r = x * 3.2406 + y * -1.5372 + z * -0.4986;
  g = x * -0.9689 + y * 1.8758 + z * 0.0415;
  b = x * 0.0557 + y * -0.204 + z * 1.057;
  r = r > 31308e-7 ? 1.055 * Math.pow(r, 1 / 2.4) - 0.055 : r * 12.92;
  g = g > 31308e-7 ? 1.055 * Math.pow(g, 1 / 2.4) - 0.055 : g * 12.92;
  b = b > 31308e-7 ? 1.055 * Math.pow(b, 1 / 2.4) - 0.055 : b * 12.92;
  r = Math.min(Math.max(0, r), 1);
  g = Math.min(Math.max(0, g), 1);
  b = Math.min(Math.max(0, b), 1);
  return [r * 255, g * 255, b * 255];
};
convert$1.xyz.lab = function(xyz) {
  var x = xyz[0];
  var y = xyz[1];
  var z = xyz[2];
  var l;
  var a;
  var b;
  x /= 95.047;
  y /= 100;
  z /= 108.883;
  x = x > 8856e-6 ? Math.pow(x, 1 / 3) : 7.787 * x + 16 / 116;
  y = y > 8856e-6 ? Math.pow(y, 1 / 3) : 7.787 * y + 16 / 116;
  z = z > 8856e-6 ? Math.pow(z, 1 / 3) : 7.787 * z + 16 / 116;
  l = 116 * y - 16;
  a = 500 * (x - y);
  b = 200 * (y - z);
  return [l, a, b];
};
convert$1.lab.xyz = function(lab) {
  var l = lab[0];
  var a = lab[1];
  var b = lab[2];
  var x;
  var y;
  var z;
  y = (l + 16) / 116;
  x = a / 500 + y;
  z = y - b / 200;
  var y2 = Math.pow(y, 3);
  var x2 = Math.pow(x, 3);
  var z2 = Math.pow(z, 3);
  y = y2 > 8856e-6 ? y2 : (y - 16 / 116) / 7.787;
  x = x2 > 8856e-6 ? x2 : (x - 16 / 116) / 7.787;
  z = z2 > 8856e-6 ? z2 : (z - 16 / 116) / 7.787;
  x *= 95.047;
  y *= 100;
  z *= 108.883;
  return [x, y, z];
};
convert$1.lab.lch = function(lab) {
  var l = lab[0];
  var a = lab[1];
  var b = lab[2];
  var hr;
  var h;
  var c;
  hr = Math.atan2(b, a);
  h = hr * 360 / 2 / Math.PI;
  if (h < 0) {
    h += 360;
  }
  c = Math.sqrt(a * a + b * b);
  return [l, c, h];
};
convert$1.lch.lab = function(lch) {
  var l = lch[0];
  var c = lch[1];
  var h = lch[2];
  var a;
  var b;
  var hr;
  hr = h / 360 * 2 * Math.PI;
  a = c * Math.cos(hr);
  b = c * Math.sin(hr);
  return [l, a, b];
};
convert$1.rgb.ansi16 = function(args) {
  var r = args[0];
  var g = args[1];
  var b = args[2];
  var value = 1 in arguments ? arguments[1] : convert$1.rgb.hsv(args)[2];
  value = Math.round(value / 50);
  if (value === 0) {
    return 30;
  }
  var ansi = 30 + (Math.round(b / 255) << 2 | Math.round(g / 255) << 1 | Math.round(r / 255));
  if (value === 2) {
    ansi += 60;
  }
  return ansi;
};
convert$1.hsv.ansi16 = function(args) {
  return convert$1.rgb.ansi16(convert$1.hsv.rgb(args), args[2]);
};
convert$1.rgb.ansi256 = function(args) {
  var r = args[0];
  var g = args[1];
  var b = args[2];
  if (r === g && g === b) {
    if (r < 8) {
      return 16;
    }
    if (r > 248) {
      return 231;
    }
    return Math.round((r - 8) / 247 * 24) + 232;
  }
  var ansi = 16 + 36 * Math.round(r / 255 * 5) + 6 * Math.round(g / 255 * 5) + Math.round(b / 255 * 5);
  return ansi;
};
convert$1.ansi16.rgb = function(args) {
  var color = args % 10;
  if (color === 0 || color === 7) {
    if (args > 50) {
      color += 3.5;
    }
    color = color / 10.5 * 255;
    return [color, color, color];
  }
  var mult = (~~(args > 50) + 1) * 0.5;
  var r = (color & 1) * mult * 255;
  var g = (color >> 1 & 1) * mult * 255;
  var b = (color >> 2 & 1) * mult * 255;
  return [r, g, b];
};
convert$1.ansi256.rgb = function(args) {
  if (args >= 232) {
    var c = (args - 232) * 10 + 8;
    return [c, c, c];
  }
  args -= 16;
  var rem;
  var r = Math.floor(args / 36) / 5 * 255;
  var g = Math.floor((rem = args % 36) / 6) / 5 * 255;
  var b = rem % 6 / 5 * 255;
  return [r, g, b];
};
convert$1.rgb.hex = function(args) {
  var integer = ((Math.round(args[0]) & 255) << 16) + ((Math.round(args[1]) & 255) << 8) + (Math.round(args[2]) & 255);
  var string = integer.toString(16).toUpperCase();
  return "000000".substring(string.length) + string;
};
convert$1.hex.rgb = function(args) {
  var match = args.toString(16).match(/[a-f0-9]{6}|[a-f0-9]{3}/i);
  if (!match) {
    return [0, 0, 0];
  }
  var colorString = match[0];
  if (match[0].length === 3) {
    colorString = colorString.split("").map(function(char) {
      return char + char;
    }).join("");
  }
  var integer = parseInt(colorString, 16);
  var r = integer >> 16 & 255;
  var g = integer >> 8 & 255;
  var b = integer & 255;
  return [r, g, b];
};
convert$1.rgb.hcg = function(rgb) {
  var r = rgb[0] / 255;
  var g = rgb[1] / 255;
  var b = rgb[2] / 255;
  var max = Math.max(Math.max(r, g), b);
  var min = Math.min(Math.min(r, g), b);
  var chroma = max - min;
  var grayscale;
  var hue;
  if (chroma < 1) {
    grayscale = min / (1 - chroma);
  } else {
    grayscale = 0;
  }
  if (chroma <= 0) {
    hue = 0;
  } else if (max === r) {
    hue = (g - b) / chroma % 6;
  } else if (max === g) {
    hue = 2 + (b - r) / chroma;
  } else {
    hue = 4 + (r - g) / chroma + 4;
  }
  hue /= 6;
  hue %= 1;
  return [hue * 360, chroma * 100, grayscale * 100];
};
convert$1.hsl.hcg = function(hsl) {
  var s = hsl[1] / 100;
  var l = hsl[2] / 100;
  var c = 1;
  var f = 0;
  if (l < 0.5) {
    c = 2 * s * l;
  } else {
    c = 2 * s * (1 - l);
  }
  if (c < 1) {
    f = (l - 0.5 * c) / (1 - c);
  }
  return [hsl[0], c * 100, f * 100];
};
convert$1.hsv.hcg = function(hsv) {
  var s = hsv[1] / 100;
  var v = hsv[2] / 100;
  var c = s * v;
  var f = 0;
  if (c < 1) {
    f = (v - c) / (1 - c);
  }
  return [hsv[0], c * 100, f * 100];
};
convert$1.hcg.rgb = function(hcg) {
  var h = hcg[0] / 360;
  var c = hcg[1] / 100;
  var g = hcg[2] / 100;
  if (c === 0) {
    return [g * 255, g * 255, g * 255];
  }
  var pure = [0, 0, 0];
  var hi = h % 1 * 6;
  var v = hi % 1;
  var w = 1 - v;
  var mg = 0;
  switch (Math.floor(hi)) {
    case 0:
      pure[0] = 1;
      pure[1] = v;
      pure[2] = 0;
      break;
    case 1:
      pure[0] = w;
      pure[1] = 1;
      pure[2] = 0;
      break;
    case 2:
      pure[0] = 0;
      pure[1] = 1;
      pure[2] = v;
      break;
    case 3:
      pure[0] = 0;
      pure[1] = w;
      pure[2] = 1;
      break;
    case 4:
      pure[0] = v;
      pure[1] = 0;
      pure[2] = 1;
      break;
    default:
      pure[0] = 1;
      pure[1] = 0;
      pure[2] = w;
  }
  mg = (1 - c) * g;
  return [
    (c * pure[0] + mg) * 255,
    (c * pure[1] + mg) * 255,
    (c * pure[2] + mg) * 255
  ];
};
convert$1.hcg.hsv = function(hcg) {
  var c = hcg[1] / 100;
  var g = hcg[2] / 100;
  var v = c + g * (1 - c);
  var f = 0;
  if (v > 0) {
    f = c / v;
  }
  return [hcg[0], f * 100, v * 100];
};
convert$1.hcg.hsl = function(hcg) {
  var c = hcg[1] / 100;
  var g = hcg[2] / 100;
  var l = g * (1 - c) + 0.5 * c;
  var s = 0;
  if (l > 0 && l < 0.5) {
    s = c / (2 * l);
  } else if (l >= 0.5 && l < 1) {
    s = c / (2 * (1 - l));
  }
  return [hcg[0], s * 100, l * 100];
};
convert$1.hcg.hwb = function(hcg) {
  var c = hcg[1] / 100;
  var g = hcg[2] / 100;
  var v = c + g * (1 - c);
  return [hcg[0], (v - c) * 100, (1 - v) * 100];
};
convert$1.hwb.hcg = function(hwb) {
  var w = hwb[1] / 100;
  var b = hwb[2] / 100;
  var v = 1 - b;
  var c = v - w;
  var g = 0;
  if (c < 1) {
    g = (v - c) / (1 - c);
  }
  return [hwb[0], c * 100, g * 100];
};
convert$1.apple.rgb = function(apple) {
  return [apple[0] / 65535 * 255, apple[1] / 65535 * 255, apple[2] / 65535 * 255];
};
convert$1.rgb.apple = function(rgb) {
  return [rgb[0] / 255 * 65535, rgb[1] / 255 * 65535, rgb[2] / 255 * 65535];
};
convert$1.gray.rgb = function(args) {
  return [args[0] / 100 * 255, args[0] / 100 * 255, args[0] / 100 * 255];
};
convert$1.gray.hsl = convert$1.gray.hsv = function(args) {
  return [0, 0, args[0]];
};
convert$1.gray.hwb = function(gray) {
  return [0, 100, gray[0]];
};
convert$1.gray.cmyk = function(gray) {
  return [0, 0, 0, gray[0]];
};
convert$1.gray.lab = function(gray) {
  return [gray[0], 0, 0];
};
convert$1.gray.hex = function(gray) {
  var val = Math.round(gray[0] / 100 * 255) & 255;
  var integer = (val << 16) + (val << 8) + val;
  var string = integer.toString(16).toUpperCase();
  return "000000".substring(string.length) + string;
};
convert$1.rgb.gray = function(rgb) {
  var val = (rgb[0] + rgb[1] + rgb[2]) / 3;
  return [val / 255 * 100];
};
var conversions$1 = conversions$2.exports;
function buildGraph() {
  var graph = {};
  var models2 = Object.keys(conversions$1);
  for (var len = models2.length, i = 0; i < len; i++) {
    graph[models2[i]] = {
      distance: -1,
      parent: null
    };
  }
  return graph;
}
function deriveBFS(fromModel) {
  var graph = buildGraph();
  var queue = [fromModel];
  graph[fromModel].distance = 0;
  while (queue.length) {
    var current = queue.pop();
    var adjacents = Object.keys(conversions$1[current]);
    for (var len = adjacents.length, i = 0; i < len; i++) {
      var adjacent = adjacents[i];
      var node = graph[adjacent];
      if (node.distance === -1) {
        node.distance = graph[current].distance + 1;
        node.parent = current;
        queue.unshift(adjacent);
      }
    }
  }
  return graph;
}
function link(from, to) {
  return function(args) {
    return to(from(args));
  };
}
function wrapConversion(toModel, graph) {
  var path = [graph[toModel].parent, toModel];
  var fn = conversions$1[graph[toModel].parent][toModel];
  var cur = graph[toModel].parent;
  while (graph[cur].parent) {
    path.unshift(graph[cur].parent);
    fn = link(conversions$1[graph[cur].parent][cur], fn);
    cur = graph[cur].parent;
  }
  fn.conversion = path;
  return fn;
}
var route$1 = function(fromModel) {
  var graph = deriveBFS(fromModel);
  var conversion = {};
  var models2 = Object.keys(graph);
  for (var len = models2.length, i = 0; i < len; i++) {
    var toModel = models2[i];
    var node = graph[toModel];
    if (node.parent === null) {
      continue;
    }
    conversion[toModel] = wrapConversion(toModel, graph);
  }
  return conversion;
};
var conversions = conversions$2.exports;
var route = route$1;
var convert = {};
var models = Object.keys(conversions);
function wrapRaw(fn) {
  var wrappedFn = function(args) {
    if (args === void 0 || args === null) {
      return args;
    }
    if (arguments.length > 1) {
      args = Array.prototype.slice.call(arguments);
    }
    return fn(args);
  };
  if ("conversion" in fn) {
    wrappedFn.conversion = fn.conversion;
  }
  return wrappedFn;
}
function wrapRounded(fn) {
  var wrappedFn = function(args) {
    if (args === void 0 || args === null) {
      return args;
    }
    if (arguments.length > 1) {
      args = Array.prototype.slice.call(arguments);
    }
    var result = fn(args);
    if (typeof result === "object") {
      for (var len = result.length, i = 0; i < len; i++) {
        result[i] = Math.round(result[i]);
      }
    }
    return result;
  };
  if ("conversion" in fn) {
    wrappedFn.conversion = fn.conversion;
  }
  return wrappedFn;
}
models.forEach(function(fromModel) {
  convert[fromModel] = {};
  Object.defineProperty(convert[fromModel], "channels", { value: conversions[fromModel].channels });
  Object.defineProperty(convert[fromModel], "labels", { value: conversions[fromModel].labels });
  var routes = route(fromModel);
  var routeModels = Object.keys(routes);
  routeModels.forEach(function(toModel) {
    var fn = routes[toModel];
    convert[fromModel][toModel] = wrapRounded(fn);
    convert[fromModel][toModel].raw = wrapRaw(fn);
  });
});
var colorConvert = convert;
(function(module) {
  const colorConvert$1 = colorConvert;
  const wrapAnsi16 = (fn, offset) => function() {
    const code = fn.apply(colorConvert$1, arguments);
    return `\x1B[${code + offset}m`;
  };
  const wrapAnsi256 = (fn, offset) => function() {
    const code = fn.apply(colorConvert$1, arguments);
    return `\x1B[${38 + offset};5;${code}m`;
  };
  const wrapAnsi16m = (fn, offset) => function() {
    const rgb = fn.apply(colorConvert$1, arguments);
    return `\x1B[${38 + offset};2;${rgb[0]};${rgb[1]};${rgb[2]}m`;
  };
  function assembleStyles() {
    const codes = /* @__PURE__ */ new Map();
    const styles = {
      modifier: {
        reset: [0, 0],
        bold: [1, 22],
        dim: [2, 22],
        italic: [3, 23],
        underline: [4, 24],
        inverse: [7, 27],
        hidden: [8, 28],
        strikethrough: [9, 29]
      },
      color: {
        black: [30, 39],
        red: [31, 39],
        green: [32, 39],
        yellow: [33, 39],
        blue: [34, 39],
        magenta: [35, 39],
        cyan: [36, 39],
        white: [37, 39],
        gray: [90, 39],
        redBright: [91, 39],
        greenBright: [92, 39],
        yellowBright: [93, 39],
        blueBright: [94, 39],
        magentaBright: [95, 39],
        cyanBright: [96, 39],
        whiteBright: [97, 39]
      },
      bgColor: {
        bgBlack: [40, 49],
        bgRed: [41, 49],
        bgGreen: [42, 49],
        bgYellow: [43, 49],
        bgBlue: [44, 49],
        bgMagenta: [45, 49],
        bgCyan: [46, 49],
        bgWhite: [47, 49],
        bgBlackBright: [100, 49],
        bgRedBright: [101, 49],
        bgGreenBright: [102, 49],
        bgYellowBright: [103, 49],
        bgBlueBright: [104, 49],
        bgMagentaBright: [105, 49],
        bgCyanBright: [106, 49],
        bgWhiteBright: [107, 49]
      }
    };
    styles.color.grey = styles.color.gray;
    for (const groupName of Object.keys(styles)) {
      const group = styles[groupName];
      for (const styleName of Object.keys(group)) {
        const style = group[styleName];
        styles[styleName] = {
          open: `\x1B[${style[0]}m`,
          close: `\x1B[${style[1]}m`
        };
        group[styleName] = styles[styleName];
        codes.set(style[0], style[1]);
      }
      Object.defineProperty(styles, groupName, {
        value: group,
        enumerable: false
      });
      Object.defineProperty(styles, "codes", {
        value: codes,
        enumerable: false
      });
    }
    const ansi2ansi = (n) => n;
    const rgb2rgb = (r, g, b) => [r, g, b];
    styles.color.close = "\x1B[39m";
    styles.bgColor.close = "\x1B[49m";
    styles.color.ansi = {
      ansi: wrapAnsi16(ansi2ansi, 0)
    };
    styles.color.ansi256 = {
      ansi256: wrapAnsi256(ansi2ansi, 0)
    };
    styles.color.ansi16m = {
      rgb: wrapAnsi16m(rgb2rgb, 0)
    };
    styles.bgColor.ansi = {
      ansi: wrapAnsi16(ansi2ansi, 10)
    };
    styles.bgColor.ansi256 = {
      ansi256: wrapAnsi256(ansi2ansi, 10)
    };
    styles.bgColor.ansi16m = {
      rgb: wrapAnsi16m(rgb2rgb, 10)
    };
    for (let key of Object.keys(colorConvert$1)) {
      if (typeof colorConvert$1[key] !== "object") {
        continue;
      }
      const suite = colorConvert$1[key];
      if (key === "ansi16") {
        key = "ansi";
      }
      if ("ansi16" in suite) {
        styles.color.ansi[key] = wrapAnsi16(suite.ansi16, 0);
        styles.bgColor.ansi[key] = wrapAnsi16(suite.ansi16, 10);
      }
      if ("ansi256" in suite) {
        styles.color.ansi256[key] = wrapAnsi256(suite.ansi256, 0);
        styles.bgColor.ansi256[key] = wrapAnsi256(suite.ansi256, 10);
      }
      if ("rgb" in suite) {
        styles.color.ansi16m[key] = wrapAnsi16m(suite.rgb, 0);
        styles.bgColor.ansi16m[key] = wrapAnsi16m(suite.rgb, 10);
      }
    }
    return styles;
  }
  Object.defineProperty(module, "exports", {
    enumerable: true,
    get: assembleStyles
  });
})(ansiStyles);
var browser = {
  stdout: false,
  stderr: false
};
const TEMPLATE_REGEX = /(?:\\(u[a-f\d]{4}|x[a-f\d]{2}|.))|(?:\{(~)?(\w+(?:\([^)]*\))?(?:\.\w+(?:\([^)]*\))?)*)(?:[ \t]|(?=\r?\n)))|(\})|((?:.|[\r\n\f])+?)/gi;
const STYLE_REGEX = /(?:^|\.)(\w+)(?:\(([^)]*)\))?/g;
const STRING_REGEX = /^(['"])((?:\\.|(?!\1)[^\\])*)\1$/;
const ESCAPE_REGEX = /\\(u[a-f\d]{4}|x[a-f\d]{2}|.)|([^\\])/gi;
const ESCAPES = /* @__PURE__ */ new Map([
  ["n", "\n"],
  ["r", "\r"],
  ["t", "	"],
  ["b", "\b"],
  ["f", "\f"],
  ["v", "\v"],
  ["0", "\0"],
  ["\\", "\\"],
  ["e", "\x1B"],
  ["a", "\x07"]
]);
function unescape(c) {
  if (c[0] === "u" && c.length === 5 || c[0] === "x" && c.length === 3) {
    return String.fromCharCode(parseInt(c.slice(1), 16));
  }
  return ESCAPES.get(c) || c;
}
function parseArguments(name, args) {
  const results = [];
  const chunks = args.trim().split(/\s*,\s*/g);
  let matches;
  for (const chunk of chunks) {
    if (!isNaN(chunk)) {
      results.push(Number(chunk));
    } else if (matches = chunk.match(STRING_REGEX)) {
      results.push(matches[2].replace(ESCAPE_REGEX, (m, escape, chr) => escape ? unescape(escape) : chr));
    } else {
      throw new Error(`Invalid Chalk template style argument: ${chunk} (in style '${name}')`);
    }
  }
  return results;
}
function parseStyle(style) {
  STYLE_REGEX.lastIndex = 0;
  const results = [];
  let matches;
  while ((matches = STYLE_REGEX.exec(style)) !== null) {
    const name = matches[1];
    if (matches[2]) {
      const args = parseArguments(name, matches[2]);
      results.push([name].concat(args));
    } else {
      results.push([name]);
    }
  }
  return results;
}
function buildStyle(chalk2, styles) {
  const enabled = {};
  for (const layer of styles) {
    for (const style of layer.styles) {
      enabled[style[0]] = layer.inverse ? null : style.slice(1);
    }
  }
  let current = chalk2;
  for (const styleName of Object.keys(enabled)) {
    if (Array.isArray(enabled[styleName])) {
      if (!(styleName in current)) {
        throw new Error(`Unknown Chalk style: ${styleName}`);
      }
      if (enabled[styleName].length > 0) {
        current = current[styleName].apply(current, enabled[styleName]);
      } else {
        current = current[styleName];
      }
    }
  }
  return current;
}
var templates = (chalk2, tmp) => {
  const styles = [];
  const chunks = [];
  let chunk = [];
  tmp.replace(TEMPLATE_REGEX, (m, escapeChar, inverse, style, close, chr) => {
    if (escapeChar) {
      chunk.push(unescape(escapeChar));
    } else if (style) {
      const str = chunk.join("");
      chunk = [];
      chunks.push(styles.length === 0 ? str : buildStyle(chalk2, styles)(str));
      styles.push({ inverse, styles: parseStyle(style) });
    } else if (close) {
      if (styles.length === 0) {
        throw new Error("Found extraneous } in Chalk template literal");
      }
      chunks.push(buildStyle(chalk2, styles)(chunk.join("")));
      chunk = [];
      styles.pop();
    } else {
      chunk.push(chr);
    }
  });
  chunks.push(chunk.join(""));
  if (styles.length > 0) {
    const errMsg = `Chalk template literal is missing ${styles.length} closing bracket${styles.length === 1 ? "" : "s"} (\`}\`)`;
    throw new Error(errMsg);
  }
  return chunks.join("");
};
(function(module) {
  const escapeStringRegexp$1 = escapeStringRegexp;
  const ansiStyles$1 = ansiStyles.exports;
  const stdoutColor = browser.stdout;
  const template = templates;
  const isSimpleWindowsTerm = process.platform === "win32" && !({}.TERM || "").toLowerCase().startsWith("xterm");
  const levelMapping = ["ansi", "ansi", "ansi256", "ansi16m"];
  const skipModels = /* @__PURE__ */ new Set(["gray"]);
  const styles = /* @__PURE__ */ Object.create(null);
  function applyOptions(obj, options) {
    options = options || {};
    const scLevel = 0;
    obj.level = options.level === void 0 ? scLevel : options.level;
    obj.enabled = "enabled" in options ? options.enabled : obj.level > 0;
  }
  function Chalk(options) {
    if (!this || !(this instanceof Chalk) || this.template) {
      const chalk2 = {};
      applyOptions(chalk2, options);
      chalk2.template = function() {
        const args = [].slice.call(arguments);
        return chalkTag.apply(null, [chalk2.template].concat(args));
      };
      Object.setPrototypeOf(chalk2, Chalk.prototype);
      Object.setPrototypeOf(chalk2.template, chalk2);
      chalk2.template.constructor = Chalk;
      return chalk2.template;
    }
    applyOptions(this, options);
  }
  if (isSimpleWindowsTerm) {
    ansiStyles$1.blue.open = "\x1B[94m";
  }
  for (const key of Object.keys(ansiStyles$1)) {
    ansiStyles$1[key].closeRe = new RegExp(escapeStringRegexp$1(ansiStyles$1[key].close), "g");
    styles[key] = {
      get() {
        const codes = ansiStyles$1[key];
        return build.call(this, this._styles ? this._styles.concat(codes) : [codes], this._empty, key);
      }
    };
  }
  styles.visible = {
    get() {
      return build.call(this, this._styles || [], true, "visible");
    }
  };
  ansiStyles$1.color.closeRe = new RegExp(escapeStringRegexp$1(ansiStyles$1.color.close), "g");
  for (const model of Object.keys(ansiStyles$1.color.ansi)) {
    if (skipModels.has(model)) {
      continue;
    }
    styles[model] = {
      get() {
        const level = this.level;
        return function() {
          const open = ansiStyles$1.color[levelMapping[level]][model].apply(null, arguments);
          const codes = {
            open,
            close: ansiStyles$1.color.close,
            closeRe: ansiStyles$1.color.closeRe
          };
          return build.call(this, this._styles ? this._styles.concat(codes) : [codes], this._empty, model);
        };
      }
    };
  }
  ansiStyles$1.bgColor.closeRe = new RegExp(escapeStringRegexp$1(ansiStyles$1.bgColor.close), "g");
  for (const model of Object.keys(ansiStyles$1.bgColor.ansi)) {
    if (skipModels.has(model)) {
      continue;
    }
    const bgModel = "bg" + model[0].toUpperCase() + model.slice(1);
    styles[bgModel] = {
      get() {
        const level = this.level;
        return function() {
          const open = ansiStyles$1.bgColor[levelMapping[level]][model].apply(null, arguments);
          const codes = {
            open,
            close: ansiStyles$1.bgColor.close,
            closeRe: ansiStyles$1.bgColor.closeRe
          };
          return build.call(this, this._styles ? this._styles.concat(codes) : [codes], this._empty, model);
        };
      }
    };
  }
  const proto = Object.defineProperties(() => {
  }, styles);
  function build(_styles, _empty, key) {
    const builder = function() {
      return applyStyle.apply(builder, arguments);
    };
    builder._styles = _styles;
    builder._empty = _empty;
    const self = this;
    Object.defineProperty(builder, "level", {
      enumerable: true,
      get() {
        return self.level;
      },
      set(level) {
        self.level = level;
      }
    });
    Object.defineProperty(builder, "enabled", {
      enumerable: true,
      get() {
        return self.enabled;
      },
      set(enabled) {
        self.enabled = enabled;
      }
    });
    builder.hasGrey = this.hasGrey || key === "gray" || key === "grey";
    builder.__proto__ = proto;
    return builder;
  }
  function applyStyle() {
    const args = arguments;
    const argsLen = args.length;
    let str = String(arguments[0]);
    if (argsLen === 0) {
      return "";
    }
    if (argsLen > 1) {
      for (let a = 1; a < argsLen; a++) {
        str += " " + args[a];
      }
    }
    if (!this.enabled || this.level <= 0 || !str) {
      return this._empty ? "" : str;
    }
    const originalDim = ansiStyles$1.dim.open;
    if (isSimpleWindowsTerm && this.hasGrey) {
      ansiStyles$1.dim.open = "";
    }
    for (const code of this._styles.slice().reverse()) {
      str = code.open + str.replace(code.closeRe, code.open) + code.close;
      str = str.replace(/\r?\n/g, `${code.close}$&${code.open}`);
    }
    ansiStyles$1.dim.open = originalDim;
    return str;
  }
  function chalkTag(chalk2, strings) {
    if (!Array.isArray(strings)) {
      return [].slice.call(arguments, 1).join(" ");
    }
    const args = [].slice.call(arguments, 2);
    const parts = [strings.raw[0]];
    for (let i = 1; i < strings.length; i++) {
      parts.push(String(args[i - 1]).replace(/[{}\\]/g, "\\$&"));
      parts.push(String(strings.raw[i]));
    }
    return template(chalk2, parts.join(""));
  }
  Object.defineProperties(Chalk.prototype, styles);
  module.exports = Chalk();
  module.exports.supportsColor = stdoutColor;
  module.exports.default = module.exports;
})(chalk$1);
var chalk = chalk$1.exports;
var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function(obj) {
  return typeof obj;
} : function(obj) {
  return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
};
var classCallCheck = function(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
};
var createClass = function() {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor)
        descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }
  return function(Constructor, protoProps, staticProps) {
    if (protoProps)
      defineProperties(Constructor.prototype, protoProps);
    if (staticProps)
      defineProperties(Constructor, staticProps);
    return Constructor;
  };
}();
var get = function get2(object, property, receiver) {
  if (object === null)
    object = Function.prototype;
  var desc = Object.getOwnPropertyDescriptor(object, property);
  if (desc === void 0) {
    var parent = Object.getPrototypeOf(object);
    if (parent === null) {
      return void 0;
    } else {
      return get2(parent, property, receiver);
    }
  } else if ("value" in desc) {
    return desc.value;
  } else {
    var getter = desc.get;
    if (getter === void 0) {
      return void 0;
    }
    return getter.call(receiver);
  }
};
var inherits = function(subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
  }
  subClass.prototype = Object.create(superClass && superClass.prototype, {
    constructor: {
      value: subClass,
      enumerable: false,
      writable: true,
      configurable: true
    }
  });
  if (superClass)
    Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
};
var possibleConstructorReturn = function(self, call) {
  if (!self) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }
  return call && (typeof call === "object" || typeof call === "function") ? call : self;
};
var slicedToArray = function() {
  function sliceIterator(arr, i) {
    var _arr = [];
    var _n = true;
    var _d = false;
    var _e = void 0;
    try {
      for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
        _arr.push(_s.value);
        if (i && _arr.length === i)
          break;
      }
    } catch (err) {
      _d = true;
      _e = err;
    } finally {
      try {
        if (!_n && _i["return"])
          _i["return"]();
      } finally {
        if (_d)
          throw _e;
      }
    }
    return _arr;
  }
  return function(arr, i) {
    if (Array.isArray(arr)) {
      return arr;
    } else if (Symbol.iterator in Object(arr)) {
      return sliceIterator(arr, i);
    } else {
      throw new TypeError("Invalid attempt to destructure non-iterable instance");
    }
  };
}();
var toConsumableArray = function(arr) {
  if (Array.isArray(arr)) {
    for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++)
      arr2[i] = arr[i];
    return arr2;
  } else {
    return Array.from(arr);
  }
};
var Processor = function() {
  function Processor2(options) {
    classCallCheck(this, Processor2);
    this.selfOptions = options || {};
    this.pipes = {};
  }
  createClass(Processor2, [{
    key: "options",
    value: function options(_options) {
      if (_options) {
        this.selfOptions = _options;
      }
      return this.selfOptions;
    }
  }, {
    key: "pipe",
    value: function pipe(name, pipeArg) {
      var pipe2 = pipeArg;
      if (typeof name === "string") {
        if (typeof pipe2 === "undefined") {
          return this.pipes[name];
        } else {
          this.pipes[name] = pipe2;
        }
      }
      if (name && name.name) {
        pipe2 = name;
        if (pipe2.processor === this) {
          return pipe2;
        }
        this.pipes[pipe2.name] = pipe2;
      }
      pipe2.processor = this;
      return pipe2;
    }
  }, {
    key: "process",
    value: function process2(input, pipe) {
      var context = input;
      context.options = this.options();
      var nextPipe = pipe || input.pipe || "default";
      var lastPipe = void 0;
      var lastContext = void 0;
      while (nextPipe) {
        if (typeof context.nextAfterChildren !== "undefined") {
          context.next = context.nextAfterChildren;
          context.nextAfterChildren = null;
        }
        if (typeof nextPipe === "string") {
          nextPipe = this.pipe(nextPipe);
        }
        nextPipe.process(context);
        lastContext = context;
        lastPipe = nextPipe;
        nextPipe = null;
        if (context) {
          if (context.next) {
            context = context.next;
            nextPipe = lastContext.nextPipe || context.pipe || lastPipe;
          }
        }
      }
      return context.hasResult ? context.result : void 0;
    }
  }]);
  return Processor2;
}();
var Pipe = function() {
  function Pipe2(name) {
    classCallCheck(this, Pipe2);
    this.name = name;
    this.filters = [];
  }
  createClass(Pipe2, [{
    key: "process",
    value: function process2(input) {
      if (!this.processor) {
        throw new Error("add this pipe to a processor before using it");
      }
      var debug = this.debug;
      var length = this.filters.length;
      var context = input;
      for (var index = 0; index < length; index++) {
        var filter = this.filters[index];
        if (debug) {
          this.log("filter: " + filter.filterName);
        }
        filter(context);
        if ((typeof context === "undefined" ? "undefined" : _typeof(context)) === "object" && context.exiting) {
          context.exiting = false;
          break;
        }
      }
      if (!context.next && this.resultCheck) {
        this.resultCheck(context);
      }
    }
  }, {
    key: "log",
    value: function log3(msg) {
      console.log("[jsondiffpatch] " + this.name + " pipe, " + msg);
    }
  }, {
    key: "append",
    value: function append() {
      var _filters;
      (_filters = this.filters).push.apply(_filters, arguments);
      return this;
    }
  }, {
    key: "prepend",
    value: function prepend() {
      var _filters2;
      (_filters2 = this.filters).unshift.apply(_filters2, arguments);
      return this;
    }
  }, {
    key: "indexOf",
    value: function indexOf(filterName) {
      if (!filterName) {
        throw new Error("a filter name is required");
      }
      for (var index = 0; index < this.filters.length; index++) {
        var filter = this.filters[index];
        if (filter.filterName === filterName) {
          return index;
        }
      }
      throw new Error("filter not found: " + filterName);
    }
  }, {
    key: "list",
    value: function list() {
      return this.filters.map(function(f) {
        return f.filterName;
      });
    }
  }, {
    key: "after",
    value: function after(filterName) {
      var index = this.indexOf(filterName);
      var params = Array.prototype.slice.call(arguments, 1);
      if (!params.length) {
        throw new Error("a filter is required");
      }
      params.unshift(index + 1, 0);
      Array.prototype.splice.apply(this.filters, params);
      return this;
    }
  }, {
    key: "before",
    value: function before(filterName) {
      var index = this.indexOf(filterName);
      var params = Array.prototype.slice.call(arguments, 1);
      if (!params.length) {
        throw new Error("a filter is required");
      }
      params.unshift(index, 0);
      Array.prototype.splice.apply(this.filters, params);
      return this;
    }
  }, {
    key: "replace",
    value: function replace(filterName) {
      var index = this.indexOf(filterName);
      var params = Array.prototype.slice.call(arguments, 1);
      if (!params.length) {
        throw new Error("a filter is required");
      }
      params.unshift(index, 1);
      Array.prototype.splice.apply(this.filters, params);
      return this;
    }
  }, {
    key: "remove",
    value: function remove(filterName) {
      var index = this.indexOf(filterName);
      this.filters.splice(index, 1);
      return this;
    }
  }, {
    key: "clear",
    value: function clear() {
      this.filters.length = 0;
      return this;
    }
  }, {
    key: "shouldHaveResult",
    value: function shouldHaveResult(should) {
      if (should === false) {
        this.resultCheck = null;
        return;
      }
      if (this.resultCheck) {
        return;
      }
      var pipe = this;
      this.resultCheck = function(context) {
        if (!context.hasResult) {
          console.log(context);
          var error = new Error(pipe.name + " failed");
          error.noResult = true;
          throw error;
        }
      };
      return this;
    }
  }]);
  return Pipe2;
}();
var Context = function() {
  function Context2() {
    classCallCheck(this, Context2);
  }
  createClass(Context2, [{
    key: "setResult",
    value: function setResult(result) {
      this.result = result;
      this.hasResult = true;
      return this;
    }
  }, {
    key: "exit",
    value: function exit() {
      this.exiting = true;
      return this;
    }
  }, {
    key: "switchTo",
    value: function switchTo(next, pipe) {
      if (typeof next === "string" || next instanceof Pipe) {
        this.nextPipe = next;
      } else {
        this.next = next;
        if (pipe) {
          this.nextPipe = pipe;
        }
      }
      return this;
    }
  }, {
    key: "push",
    value: function push(child, name) {
      child.parent = this;
      if (typeof name !== "undefined") {
        child.childName = name;
      }
      child.root = this.root || this;
      child.options = child.options || this.options;
      if (!this.children) {
        this.children = [child];
        this.nextAfterChildren = this.next || null;
        this.next = child;
      } else {
        this.children[this.children.length - 1].next = child;
        this.children.push(child);
      }
      child.next = this;
      return this;
    }
  }]);
  return Context2;
}();
var isArray = typeof Array.isArray === "function" ? Array.isArray : function(a) {
  return a instanceof Array;
};
function cloneRegExp(re) {
  var regexMatch = /^\/(.*)\/([gimyu]*)$/.exec(re.toString());
  return new RegExp(regexMatch[1], regexMatch[2]);
}
function clone(arg) {
  if ((typeof arg === "undefined" ? "undefined" : _typeof(arg)) !== "object") {
    return arg;
  }
  if (arg === null) {
    return null;
  }
  if (isArray(arg)) {
    return arg.map(clone);
  }
  if (arg instanceof Date) {
    return new Date(arg.getTime());
  }
  if (arg instanceof RegExp) {
    return cloneRegExp(arg);
  }
  var cloned = {};
  for (var name in arg) {
    if (Object.prototype.hasOwnProperty.call(arg, name)) {
      cloned[name] = clone(arg[name]);
    }
  }
  return cloned;
}
var DiffContext = function(_Context) {
  inherits(DiffContext2, _Context);
  function DiffContext2(left, right) {
    classCallCheck(this, DiffContext2);
    var _this = possibleConstructorReturn(this, (DiffContext2.__proto__ || Object.getPrototypeOf(DiffContext2)).call(this));
    _this.left = left;
    _this.right = right;
    _this.pipe = "diff";
    return _this;
  }
  createClass(DiffContext2, [{
    key: "setResult",
    value: function setResult(result) {
      if (this.options.cloneDiffValues && (typeof result === "undefined" ? "undefined" : _typeof(result)) === "object") {
        var clone$$1 = typeof this.options.cloneDiffValues === "function" ? this.options.cloneDiffValues : clone;
        if (_typeof(result[0]) === "object") {
          result[0] = clone$$1(result[0]);
        }
        if (_typeof(result[1]) === "object") {
          result[1] = clone$$1(result[1]);
        }
      }
      return Context.prototype.setResult.apply(this, arguments);
    }
  }]);
  return DiffContext2;
}(Context);
var PatchContext = function(_Context) {
  inherits(PatchContext2, _Context);
  function PatchContext2(left, delta) {
    classCallCheck(this, PatchContext2);
    var _this = possibleConstructorReturn(this, (PatchContext2.__proto__ || Object.getPrototypeOf(PatchContext2)).call(this));
    _this.left = left;
    _this.delta = delta;
    _this.pipe = "patch";
    return _this;
  }
  return PatchContext2;
}(Context);
var ReverseContext = function(_Context) {
  inherits(ReverseContext2, _Context);
  function ReverseContext2(delta) {
    classCallCheck(this, ReverseContext2);
    var _this = possibleConstructorReturn(this, (ReverseContext2.__proto__ || Object.getPrototypeOf(ReverseContext2)).call(this));
    _this.delta = delta;
    _this.pipe = "reverse";
    return _this;
  }
  return ReverseContext2;
}(Context);
var isArray$1 = typeof Array.isArray === "function" ? Array.isArray : function(a) {
  return a instanceof Array;
};
var diffFilter = function trivialMatchesDiffFilter(context) {
  if (context.left === context.right) {
    context.setResult(void 0).exit();
    return;
  }
  if (typeof context.left === "undefined") {
    if (typeof context.right === "function") {
      throw new Error("functions are not supported");
    }
    context.setResult([context.right]).exit();
    return;
  }
  if (typeof context.right === "undefined") {
    context.setResult([context.left, 0, 0]).exit();
    return;
  }
  if (typeof context.left === "function" || typeof context.right === "function") {
    throw new Error("functions are not supported");
  }
  context.leftType = context.left === null ? "null" : _typeof(context.left);
  context.rightType = context.right === null ? "null" : _typeof(context.right);
  if (context.leftType !== context.rightType) {
    context.setResult([context.left, context.right]).exit();
    return;
  }
  if (context.leftType === "boolean" || context.leftType === "number") {
    context.setResult([context.left, context.right]).exit();
    return;
  }
  if (context.leftType === "object") {
    context.leftIsArray = isArray$1(context.left);
  }
  if (context.rightType === "object") {
    context.rightIsArray = isArray$1(context.right);
  }
  if (context.leftIsArray !== context.rightIsArray) {
    context.setResult([context.left, context.right]).exit();
    return;
  }
  if (context.left instanceof RegExp) {
    if (context.right instanceof RegExp) {
      context.setResult([context.left.toString(), context.right.toString()]).exit();
    } else {
      context.setResult([context.left, context.right]).exit();
    }
  }
};
diffFilter.filterName = "trivial";
var patchFilter = function trivialMatchesPatchFilter(context) {
  if (typeof context.delta === "undefined") {
    context.setResult(context.left).exit();
    return;
  }
  context.nested = !isArray$1(context.delta);
  if (context.nested) {
    return;
  }
  if (context.delta.length === 1) {
    context.setResult(context.delta[0]).exit();
    return;
  }
  if (context.delta.length === 2) {
    if (context.left instanceof RegExp) {
      var regexArgs = /^\/(.*)\/([gimyu]+)$/.exec(context.delta[1]);
      if (regexArgs) {
        context.setResult(new RegExp(regexArgs[1], regexArgs[2])).exit();
        return;
      }
    }
    context.setResult(context.delta[1]).exit();
    return;
  }
  if (context.delta.length === 3 && context.delta[2] === 0) {
    context.setResult(void 0).exit();
  }
};
patchFilter.filterName = "trivial";
var reverseFilter = function trivialReferseFilter(context) {
  if (typeof context.delta === "undefined") {
    context.setResult(context.delta).exit();
    return;
  }
  context.nested = !isArray$1(context.delta);
  if (context.nested) {
    return;
  }
  if (context.delta.length === 1) {
    context.setResult([context.delta[0], 0, 0]).exit();
    return;
  }
  if (context.delta.length === 2) {
    context.setResult([context.delta[1], context.delta[0]]).exit();
    return;
  }
  if (context.delta.length === 3 && context.delta[2] === 0) {
    context.setResult([context.delta[0]]).exit();
  }
};
reverseFilter.filterName = "trivial";
function collectChildrenDiffFilter(context) {
  if (!context || !context.children) {
    return;
  }
  var length = context.children.length;
  var child = void 0;
  var result = context.result;
  for (var index = 0; index < length; index++) {
    child = context.children[index];
    if (typeof child.result === "undefined") {
      continue;
    }
    result = result || {};
    result[child.childName] = child.result;
  }
  if (result && context.leftIsArray) {
    result._t = "a";
  }
  context.setResult(result).exit();
}
collectChildrenDiffFilter.filterName = "collectChildren";
function objectsDiffFilter(context) {
  if (context.leftIsArray || context.leftType !== "object") {
    return;
  }
  var name = void 0;
  var child = void 0;
  var propertyFilter = context.options.propertyFilter;
  for (name in context.left) {
    if (!Object.prototype.hasOwnProperty.call(context.left, name)) {
      continue;
    }
    if (propertyFilter && !propertyFilter(name, context)) {
      continue;
    }
    child = new DiffContext(context.left[name], context.right[name]);
    context.push(child, name);
  }
  for (name in context.right) {
    if (!Object.prototype.hasOwnProperty.call(context.right, name)) {
      continue;
    }
    if (propertyFilter && !propertyFilter(name, context)) {
      continue;
    }
    if (typeof context.left[name] === "undefined") {
      child = new DiffContext(void 0, context.right[name]);
      context.push(child, name);
    }
  }
  if (!context.children || context.children.length === 0) {
    context.setResult(void 0).exit();
    return;
  }
  context.exit();
}
objectsDiffFilter.filterName = "objects";
var patchFilter$1 = function nestedPatchFilter(context) {
  if (!context.nested) {
    return;
  }
  if (context.delta._t) {
    return;
  }
  var name = void 0;
  var child = void 0;
  for (name in context.delta) {
    child = new PatchContext(context.left[name], context.delta[name]);
    context.push(child, name);
  }
  context.exit();
};
patchFilter$1.filterName = "objects";
var collectChildrenPatchFilter = function collectChildrenPatchFilter2(context) {
  if (!context || !context.children) {
    return;
  }
  if (context.delta._t) {
    return;
  }
  var length = context.children.length;
  var child = void 0;
  for (var index = 0; index < length; index++) {
    child = context.children[index];
    if (Object.prototype.hasOwnProperty.call(context.left, child.childName) && child.result === void 0) {
      delete context.left[child.childName];
    } else if (context.left[child.childName] !== child.result) {
      context.left[child.childName] = child.result;
    }
  }
  context.setResult(context.left).exit();
};
collectChildrenPatchFilter.filterName = "collectChildren";
var reverseFilter$1 = function nestedReverseFilter(context) {
  if (!context.nested) {
    return;
  }
  if (context.delta._t) {
    return;
  }
  var name = void 0;
  var child = void 0;
  for (name in context.delta) {
    child = new ReverseContext(context.delta[name]);
    context.push(child, name);
  }
  context.exit();
};
reverseFilter$1.filterName = "objects";
function collectChildrenReverseFilter(context) {
  if (!context || !context.children) {
    return;
  }
  if (context.delta._t) {
    return;
  }
  var length = context.children.length;
  var child = void 0;
  var delta = {};
  for (var index = 0; index < length; index++) {
    child = context.children[index];
    if (delta[child.childName] !== child.result) {
      delta[child.childName] = child.result;
    }
  }
  context.setResult(delta).exit();
}
collectChildrenReverseFilter.filterName = "collectChildren";
var defaultMatch = function defaultMatch2(array1, array2, index1, index2) {
  return array1[index1] === array2[index2];
};
var lengthMatrix = function lengthMatrix2(array1, array2, match, context) {
  var len1 = array1.length;
  var len2 = array2.length;
  var x = void 0, y = void 0;
  var matrix = [len1 + 1];
  for (x = 0; x < len1 + 1; x++) {
    matrix[x] = [len2 + 1];
    for (y = 0; y < len2 + 1; y++) {
      matrix[x][y] = 0;
    }
  }
  matrix.match = match;
  for (x = 1; x < len1 + 1; x++) {
    for (y = 1; y < len2 + 1; y++) {
      if (match(array1, array2, x - 1, y - 1, context)) {
        matrix[x][y] = matrix[x - 1][y - 1] + 1;
      } else {
        matrix[x][y] = Math.max(matrix[x - 1][y], matrix[x][y - 1]);
      }
    }
  }
  return matrix;
};
var backtrack = function backtrack2(matrix, array1, array2, context) {
  var index1 = array1.length;
  var index2 = array2.length;
  var subsequence = {
    sequence: [],
    indices1: [],
    indices2: []
  };
  while (index1 !== 0 && index2 !== 0) {
    var sameLetter = matrix.match(array1, array2, index1 - 1, index2 - 1, context);
    if (sameLetter) {
      subsequence.sequence.unshift(array1[index1 - 1]);
      subsequence.indices1.unshift(index1 - 1);
      subsequence.indices2.unshift(index2 - 1);
      --index1;
      --index2;
    } else {
      var valueAtMatrixAbove = matrix[index1][index2 - 1];
      var valueAtMatrixLeft = matrix[index1 - 1][index2];
      if (valueAtMatrixAbove > valueAtMatrixLeft) {
        --index2;
      } else {
        --index1;
      }
    }
  }
  return subsequence;
};
var get$1 = function get3(array1, array2, match, context) {
  var innerContext = context || {};
  var matrix = lengthMatrix(array1, array2, match || defaultMatch, innerContext);
  var result = backtrack(matrix, array1, array2, innerContext);
  if (typeof array1 === "string" && typeof array2 === "string") {
    result.sequence = result.sequence.join("");
  }
  return result;
};
var lcs = {
  get: get$1
};
var ARRAY_MOVE = 3;
var isArray$2 = typeof Array.isArray === "function" ? Array.isArray : function(a) {
  return a instanceof Array;
};
var arrayIndexOf = typeof Array.prototype.indexOf === "function" ? function(array, item) {
  return array.indexOf(item);
} : function(array, item) {
  var length = array.length;
  for (var i = 0; i < length; i++) {
    if (array[i] === item) {
      return i;
    }
  }
  return -1;
};
function arraysHaveMatchByRef(array1, array2, len1, len2) {
  for (var index1 = 0; index1 < len1; index1++) {
    var val1 = array1[index1];
    for (var index2 = 0; index2 < len2; index2++) {
      var val2 = array2[index2];
      if (index1 !== index2 && val1 === val2) {
        return true;
      }
    }
  }
}
function matchItems(array1, array2, index1, index2, context) {
  var value1 = array1[index1];
  var value2 = array2[index2];
  if (value1 === value2) {
    return true;
  }
  if ((typeof value1 === "undefined" ? "undefined" : _typeof(value1)) !== "object" || (typeof value2 === "undefined" ? "undefined" : _typeof(value2)) !== "object") {
    return false;
  }
  var objectHash = context.objectHash;
  if (!objectHash) {
    return context.matchByPosition && index1 === index2;
  }
  var hash1 = void 0;
  var hash2 = void 0;
  if (typeof index1 === "number") {
    context.hashCache1 = context.hashCache1 || [];
    hash1 = context.hashCache1[index1];
    if (typeof hash1 === "undefined") {
      context.hashCache1[index1] = hash1 = objectHash(value1, index1);
    }
  } else {
    hash1 = objectHash(value1);
  }
  if (typeof hash1 === "undefined") {
    return false;
  }
  if (typeof index2 === "number") {
    context.hashCache2 = context.hashCache2 || [];
    hash2 = context.hashCache2[index2];
    if (typeof hash2 === "undefined") {
      context.hashCache2[index2] = hash2 = objectHash(value2, index2);
    }
  } else {
    hash2 = objectHash(value2);
  }
  if (typeof hash2 === "undefined") {
    return false;
  }
  return hash1 === hash2;
}
var diffFilter$1 = function arraysDiffFilter(context) {
  if (!context.leftIsArray) {
    return;
  }
  var matchContext = {
    objectHash: context.options && context.options.objectHash,
    matchByPosition: context.options && context.options.matchByPosition
  };
  var commonHead = 0;
  var commonTail = 0;
  var index = void 0;
  var index1 = void 0;
  var index2 = void 0;
  var array1 = context.left;
  var array2 = context.right;
  var len1 = array1.length;
  var len2 = array2.length;
  var child = void 0;
  if (len1 > 0 && len2 > 0 && !matchContext.objectHash && typeof matchContext.matchByPosition !== "boolean") {
    matchContext.matchByPosition = !arraysHaveMatchByRef(array1, array2, len1, len2);
  }
  while (commonHead < len1 && commonHead < len2 && matchItems(array1, array2, commonHead, commonHead, matchContext)) {
    index = commonHead;
    child = new DiffContext(context.left[index], context.right[index]);
    context.push(child, index);
    commonHead++;
  }
  while (commonTail + commonHead < len1 && commonTail + commonHead < len2 && matchItems(array1, array2, len1 - 1 - commonTail, len2 - 1 - commonTail, matchContext)) {
    index1 = len1 - 1 - commonTail;
    index2 = len2 - 1 - commonTail;
    child = new DiffContext(context.left[index1], context.right[index2]);
    context.push(child, index2);
    commonTail++;
  }
  var result = void 0;
  if (commonHead + commonTail === len1) {
    if (len1 === len2) {
      context.setResult(void 0).exit();
      return;
    }
    result = result || {
      _t: "a"
    };
    for (index = commonHead; index < len2 - commonTail; index++) {
      result[index] = [array2[index]];
    }
    context.setResult(result).exit();
    return;
  }
  if (commonHead + commonTail === len2) {
    result = result || {
      _t: "a"
    };
    for (index = commonHead; index < len1 - commonTail; index++) {
      result["_" + index] = [array1[index], 0, 0];
    }
    context.setResult(result).exit();
    return;
  }
  delete matchContext.hashCache1;
  delete matchContext.hashCache2;
  var trimmed1 = array1.slice(commonHead, len1 - commonTail);
  var trimmed2 = array2.slice(commonHead, len2 - commonTail);
  var seq = lcs.get(trimmed1, trimmed2, matchItems, matchContext);
  var removedItems = [];
  result = result || {
    _t: "a"
  };
  for (index = commonHead; index < len1 - commonTail; index++) {
    if (arrayIndexOf(seq.indices1, index - commonHead) < 0) {
      result["_" + index] = [array1[index], 0, 0];
      removedItems.push(index);
    }
  }
  var detectMove = true;
  if (context.options && context.options.arrays && context.options.arrays.detectMove === false) {
    detectMove = false;
  }
  var includeValueOnMove = false;
  if (context.options && context.options.arrays && context.options.arrays.includeValueOnMove) {
    includeValueOnMove = true;
  }
  var removedItemsLength = removedItems.length;
  for (index = commonHead; index < len2 - commonTail; index++) {
    var indexOnArray2 = arrayIndexOf(seq.indices2, index - commonHead);
    if (indexOnArray2 < 0) {
      var isMove = false;
      if (detectMove && removedItemsLength > 0) {
        for (var removeItemIndex1 = 0; removeItemIndex1 < removedItemsLength; removeItemIndex1++) {
          index1 = removedItems[removeItemIndex1];
          if (matchItems(trimmed1, trimmed2, index1 - commonHead, index - commonHead, matchContext)) {
            result["_" + index1].splice(1, 2, index, ARRAY_MOVE);
            if (!includeValueOnMove) {
              result["_" + index1][0] = "";
            }
            index2 = index;
            child = new DiffContext(context.left[index1], context.right[index2]);
            context.push(child, index2);
            removedItems.splice(removeItemIndex1, 1);
            isMove = true;
            break;
          }
        }
      }
      if (!isMove) {
        result[index] = [array2[index]];
      }
    } else {
      index1 = seq.indices1[indexOnArray2] + commonHead;
      index2 = seq.indices2[indexOnArray2] + commonHead;
      child = new DiffContext(context.left[index1], context.right[index2]);
      context.push(child, index2);
    }
  }
  context.setResult(result).exit();
};
diffFilter$1.filterName = "arrays";
var compare = {
  numerically: function numerically(a, b) {
    return a - b;
  },
  numericallyBy: function numericallyBy(name) {
    return function(a, b) {
      return a[name] - b[name];
    };
  }
};
var patchFilter$2 = function nestedPatchFilter2(context) {
  if (!context.nested) {
    return;
  }
  if (context.delta._t !== "a") {
    return;
  }
  var index = void 0;
  var index1 = void 0;
  var delta = context.delta;
  var array = context.left;
  var toRemove = [];
  var toInsert = [];
  var toModify = [];
  for (index in delta) {
    if (index !== "_t") {
      if (index[0] === "_") {
        if (delta[index][2] === 0 || delta[index][2] === ARRAY_MOVE) {
          toRemove.push(parseInt(index.slice(1), 10));
        } else {
          throw new Error("only removal or move can be applied at original array indices," + (" invalid diff type: " + delta[index][2]));
        }
      } else {
        if (delta[index].length === 1) {
          toInsert.push({
            index: parseInt(index, 10),
            value: delta[index][0]
          });
        } else {
          toModify.push({
            index: parseInt(index, 10),
            delta: delta[index]
          });
        }
      }
    }
  }
  toRemove = toRemove.sort(compare.numerically);
  for (index = toRemove.length - 1; index >= 0; index--) {
    index1 = toRemove[index];
    var indexDiff = delta["_" + index1];
    var removedValue = array.splice(index1, 1)[0];
    if (indexDiff[2] === ARRAY_MOVE) {
      toInsert.push({
        index: indexDiff[1],
        value: removedValue
      });
    }
  }
  toInsert = toInsert.sort(compare.numericallyBy("index"));
  var toInsertLength = toInsert.length;
  for (index = 0; index < toInsertLength; index++) {
    var insertion = toInsert[index];
    array.splice(insertion.index, 0, insertion.value);
  }
  var toModifyLength = toModify.length;
  var child = void 0;
  if (toModifyLength > 0) {
    for (index = 0; index < toModifyLength; index++) {
      var modification = toModify[index];
      child = new PatchContext(context.left[modification.index], modification.delta);
      context.push(child, modification.index);
    }
  }
  if (!context.children) {
    context.setResult(context.left).exit();
    return;
  }
  context.exit();
};
patchFilter$2.filterName = "arrays";
var collectChildrenPatchFilter$1 = function collectChildrenPatchFilter3(context) {
  if (!context || !context.children) {
    return;
  }
  if (context.delta._t !== "a") {
    return;
  }
  var length = context.children.length;
  var child = void 0;
  for (var index = 0; index < length; index++) {
    child = context.children[index];
    context.left[child.childName] = child.result;
  }
  context.setResult(context.left).exit();
};
collectChildrenPatchFilter$1.filterName = "arraysCollectChildren";
var reverseFilter$2 = function arraysReverseFilter(context) {
  if (!context.nested) {
    if (context.delta[2] === ARRAY_MOVE) {
      context.newName = "_" + context.delta[1];
      context.setResult([context.delta[0], parseInt(context.childName.substr(1), 10), ARRAY_MOVE]).exit();
    }
    return;
  }
  if (context.delta._t !== "a") {
    return;
  }
  var name = void 0;
  var child = void 0;
  for (name in context.delta) {
    if (name === "_t") {
      continue;
    }
    child = new ReverseContext(context.delta[name]);
    context.push(child, name);
  }
  context.exit();
};
reverseFilter$2.filterName = "arrays";
var reverseArrayDeltaIndex = function reverseArrayDeltaIndex2(delta, index, itemDelta) {
  if (typeof index === "string" && index[0] === "_") {
    return parseInt(index.substr(1), 10);
  } else if (isArray$2(itemDelta) && itemDelta[2] === 0) {
    return "_" + index;
  }
  var reverseIndex = +index;
  for (var deltaIndex in delta) {
    var deltaItem = delta[deltaIndex];
    if (isArray$2(deltaItem)) {
      if (deltaItem[2] === ARRAY_MOVE) {
        var moveFromIndex = parseInt(deltaIndex.substr(1), 10);
        var moveToIndex = deltaItem[1];
        if (moveToIndex === +index) {
          return moveFromIndex;
        }
        if (moveFromIndex <= reverseIndex && moveToIndex > reverseIndex) {
          reverseIndex++;
        } else if (moveFromIndex >= reverseIndex && moveToIndex < reverseIndex) {
          reverseIndex--;
        }
      } else if (deltaItem[2] === 0) {
        var deleteIndex = parseInt(deltaIndex.substr(1), 10);
        if (deleteIndex <= reverseIndex) {
          reverseIndex++;
        }
      } else if (deltaItem.length === 1 && deltaIndex <= reverseIndex) {
        reverseIndex--;
      }
    }
  }
  return reverseIndex;
};
function collectChildrenReverseFilter$1(context) {
  if (!context || !context.children) {
    return;
  }
  if (context.delta._t !== "a") {
    return;
  }
  var length = context.children.length;
  var child = void 0;
  var delta = {
    _t: "a"
  };
  for (var index = 0; index < length; index++) {
    child = context.children[index];
    var name = child.newName;
    if (typeof name === "undefined") {
      name = reverseArrayDeltaIndex(context.delta, child.childName, child.result);
    }
    if (delta[name] !== child.result) {
      delta[name] = child.result;
    }
  }
  context.setResult(delta).exit();
}
collectChildrenReverseFilter$1.filterName = "arraysCollectChildren";
var diffFilter$2 = function datesDiffFilter(context) {
  if (context.left instanceof Date) {
    if (context.right instanceof Date) {
      if (context.left.getTime() !== context.right.getTime()) {
        context.setResult([context.left, context.right]);
      } else {
        context.setResult(void 0);
      }
    } else {
      context.setResult([context.left, context.right]);
    }
    context.exit();
  } else if (context.right instanceof Date) {
    context.setResult([context.left, context.right]).exit();
  }
};
diffFilter$2.filterName = "dates";
var TEXT_DIFF = 2;
var DEFAULT_MIN_LENGTH = 60;
var cachedDiffPatch = null;
var getDiffMatchPatch = function getDiffMatchPatch2(required) {
  if (!cachedDiffPatch) {
    var instance = void 0;
    if (typeof diff_match_patch !== "undefined") {
      instance = typeof diff_match_patch === "function" ? new diff_match_patch() : new diff_match_patch.diff_match_patch();
    } else if (dmp) {
      try {
        instance = dmp && new dmp();
      } catch (err) {
        instance = null;
      }
    }
    if (!instance) {
      if (!required) {
        return null;
      }
      var error = new Error("text diff_match_patch library not found");
      error.diff_match_patch_not_found = true;
      throw error;
    }
    cachedDiffPatch = {
      diff: function diff(txt1, txt2) {
        return instance.patch_toText(instance.patch_make(txt1, txt2));
      },
      patch: function patch(txt1, _patch) {
        var results = instance.patch_apply(instance.patch_fromText(_patch), txt1);
        for (var i = 0; i < results[1].length; i++) {
          if (!results[1][i]) {
            var _error = new Error("text patch failed");
            _error.textPatchFailed = true;
          }
        }
        return results[0];
      }
    };
  }
  return cachedDiffPatch;
};
var diffFilter$3 = function textsDiffFilter(context) {
  if (context.leftType !== "string") {
    return;
  }
  var minLength = context.options && context.options.textDiff && context.options.textDiff.minLength || DEFAULT_MIN_LENGTH;
  if (context.left.length < minLength || context.right.length < minLength) {
    context.setResult([context.left, context.right]).exit();
    return;
  }
  var diffMatchPatch2 = getDiffMatchPatch();
  if (!diffMatchPatch2) {
    context.setResult([context.left, context.right]).exit();
    return;
  }
  var diff = diffMatchPatch2.diff;
  context.setResult([diff(context.left, context.right), 0, TEXT_DIFF]).exit();
};
diffFilter$3.filterName = "texts";
var patchFilter$3 = function textsPatchFilter(context) {
  if (context.nested) {
    return;
  }
  if (context.delta[2] !== TEXT_DIFF) {
    return;
  }
  var patch = getDiffMatchPatch(true).patch;
  context.setResult(patch(context.left, context.delta[0])).exit();
};
patchFilter$3.filterName = "texts";
var textDeltaReverse = function textDeltaReverse2(delta) {
  var i = void 0;
  var l = void 0;
  var lines = void 0;
  var line = void 0;
  var lineTmp = void 0;
  var header = null;
  var headerRegex = /^@@ +-(\d+),(\d+) +\+(\d+),(\d+) +@@$/;
  var lineHeader = void 0;
  lines = delta.split("\n");
  for (i = 0, l = lines.length; i < l; i++) {
    line = lines[i];
    var lineStart = line.slice(0, 1);
    if (lineStart === "@") {
      header = headerRegex.exec(line);
      lineHeader = i;
      lines[lineHeader] = "@@ -" + header[3] + "," + header[4] + " +" + header[1] + "," + header[2] + " @@";
    } else if (lineStart === "+") {
      lines[i] = "-" + lines[i].slice(1);
      if (lines[i - 1].slice(0, 1) === "+") {
        lineTmp = lines[i];
        lines[i] = lines[i - 1];
        lines[i - 1] = lineTmp;
      }
    } else if (lineStart === "-") {
      lines[i] = "+" + lines[i].slice(1);
    }
  }
  return lines.join("\n");
};
var reverseFilter$3 = function textsReverseFilter(context) {
  if (context.nested) {
    return;
  }
  if (context.delta[2] !== TEXT_DIFF) {
    return;
  }
  context.setResult([textDeltaReverse(context.delta[0]), 0, TEXT_DIFF]).exit();
};
reverseFilter$3.filterName = "texts";
var DiffPatcher = function() {
  function DiffPatcher2(options) {
    classCallCheck(this, DiffPatcher2);
    this.processor = new Processor(options);
    this.processor.pipe(new Pipe("diff").append(collectChildrenDiffFilter, diffFilter, diffFilter$2, diffFilter$3, objectsDiffFilter, diffFilter$1).shouldHaveResult());
    this.processor.pipe(new Pipe("patch").append(collectChildrenPatchFilter, collectChildrenPatchFilter$1, patchFilter, patchFilter$3, patchFilter$1, patchFilter$2).shouldHaveResult());
    this.processor.pipe(new Pipe("reverse").append(collectChildrenReverseFilter, collectChildrenReverseFilter$1, reverseFilter, reverseFilter$3, reverseFilter$1, reverseFilter$2).shouldHaveResult());
  }
  createClass(DiffPatcher2, [{
    key: "options",
    value: function options() {
      var _processor;
      return (_processor = this.processor).options.apply(_processor, arguments);
    }
  }, {
    key: "diff",
    value: function diff(left, right) {
      return this.processor.process(new DiffContext(left, right));
    }
  }, {
    key: "patch",
    value: function patch(left, delta) {
      return this.processor.process(new PatchContext(left, delta));
    }
  }, {
    key: "reverse",
    value: function reverse(delta) {
      return this.processor.process(new ReverseContext(delta));
    }
  }, {
    key: "unpatch",
    value: function unpatch(right, delta) {
      return this.patch(right, this.reverse(delta));
    }
  }, {
    key: "clone",
    value: function clone$$1(value) {
      return clone(value);
    }
  }]);
  return DiffPatcher2;
}();
var isArray$3 = typeof Array.isArray === "function" ? Array.isArray : function(a) {
  return a instanceof Array;
};
var getObjectKeys = typeof Object.keys === "function" ? function(obj) {
  return Object.keys(obj);
} : function(obj) {
  var names = [];
  for (var property in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, property)) {
      names.push(property);
    }
  }
  return names;
};
var trimUnderscore = function trimUnderscore2(str) {
  if (str.substr(0, 1) === "_") {
    return str.slice(1);
  }
  return str;
};
var arrayKeyToSortNumber = function arrayKeyToSortNumber2(key) {
  if (key === "_t") {
    return -1;
  } else {
    if (key.substr(0, 1) === "_") {
      return parseInt(key.slice(1), 10);
    } else {
      return parseInt(key, 10) + 0.1;
    }
  }
};
var arrayKeyComparer = function arrayKeyComparer2(key1, key2) {
  return arrayKeyToSortNumber(key1) - arrayKeyToSortNumber(key2);
};
var BaseFormatter = function() {
  function BaseFormatter2() {
    classCallCheck(this, BaseFormatter2);
  }
  createClass(BaseFormatter2, [{
    key: "format",
    value: function format4(delta, left) {
      var context = {};
      this.prepareContext(context);
      this.recurse(context, delta, left);
      return this.finalize(context);
    }
  }, {
    key: "prepareContext",
    value: function prepareContext(context) {
      context.buffer = [];
      context.out = function() {
        var _buffer;
        (_buffer = this.buffer).push.apply(_buffer, arguments);
      };
    }
  }, {
    key: "typeFormattterNotFound",
    value: function typeFormattterNotFound(context, deltaType) {
      throw new Error("cannot format delta type: " + deltaType);
    }
  }, {
    key: "typeFormattterErrorFormatter",
    value: function typeFormattterErrorFormatter(context, err) {
      return err.toString();
    }
  }, {
    key: "finalize",
    value: function finalize(_ref) {
      var buffer = _ref.buffer;
      if (isArray$3(buffer)) {
        return buffer.join("");
      }
    }
  }, {
    key: "recurse",
    value: function recurse(context, delta, left, key, leftKey, movedFrom, isLast) {
      var useMoveOriginHere = delta && movedFrom;
      var leftValue = useMoveOriginHere ? movedFrom.value : left;
      if (typeof delta === "undefined" && typeof key === "undefined") {
        return void 0;
      }
      var type = this.getDeltaType(delta, movedFrom);
      var nodeType = type === "node" ? delta._t === "a" ? "array" : "object" : "";
      if (typeof key !== "undefined") {
        this.nodeBegin(context, key, leftKey, type, nodeType, isLast);
      } else {
        this.rootBegin(context, type, nodeType);
      }
      var typeFormattter = void 0;
      try {
        typeFormattter = this["format_" + type] || this.typeFormattterNotFound(context, type);
        typeFormattter.call(this, context, delta, leftValue, key, leftKey, movedFrom);
      } catch (err) {
        this.typeFormattterErrorFormatter(context, err, delta, leftValue, key, leftKey, movedFrom);
        if (typeof console !== "undefined" && console.error) {
          console.error(err.stack);
        }
      }
      if (typeof key !== "undefined") {
        this.nodeEnd(context, key, leftKey, type, nodeType, isLast);
      } else {
        this.rootEnd(context, type, nodeType);
      }
    }
  }, {
    key: "formatDeltaChildren",
    value: function formatDeltaChildren(context, delta, left) {
      var self = this;
      this.forEachDeltaKey(delta, left, function(key, leftKey, movedFrom, isLast) {
        self.recurse(context, delta[key], left ? left[leftKey] : void 0, key, leftKey, movedFrom, isLast);
      });
    }
  }, {
    key: "forEachDeltaKey",
    value: function forEachDeltaKey(delta, left, fn) {
      var keys = getObjectKeys(delta);
      var arrayKeys = delta._t === "a";
      var moveDestinations = {};
      var name = void 0;
      if (typeof left !== "undefined") {
        for (name in left) {
          if (Object.prototype.hasOwnProperty.call(left, name)) {
            if (typeof delta[name] === "undefined" && (!arrayKeys || typeof delta["_" + name] === "undefined")) {
              keys.push(name);
            }
          }
        }
      }
      for (name in delta) {
        if (Object.prototype.hasOwnProperty.call(delta, name)) {
          var value = delta[name];
          if (isArray$3(value) && value[2] === 3) {
            moveDestinations[value[1].toString()] = {
              key: name,
              value: left && left[parseInt(name.substr(1))]
            };
            if (this.includeMoveDestinations !== false) {
              if (typeof left === "undefined" && typeof delta[value[1]] === "undefined") {
                keys.push(value[1].toString());
              }
            }
          }
        }
      }
      if (arrayKeys) {
        keys.sort(arrayKeyComparer);
      } else {
        keys.sort();
      }
      for (var index = 0, length = keys.length; index < length; index++) {
        var key = keys[index];
        if (arrayKeys && key === "_t") {
          continue;
        }
        var leftKey = arrayKeys ? typeof key === "number" ? key : parseInt(trimUnderscore(key), 10) : key;
        var isLast = index === length - 1;
        fn(key, leftKey, moveDestinations[leftKey], isLast);
      }
    }
  }, {
    key: "getDeltaType",
    value: function getDeltaType(delta, movedFrom) {
      if (typeof delta === "undefined") {
        if (typeof movedFrom !== "undefined") {
          return "movedestination";
        }
        return "unchanged";
      }
      if (isArray$3(delta)) {
        if (delta.length === 1) {
          return "added";
        }
        if (delta.length === 2) {
          return "modified";
        }
        if (delta.length === 3 && delta[2] === 0) {
          return "deleted";
        }
        if (delta.length === 3 && delta[2] === 2) {
          return "textdiff";
        }
        if (delta.length === 3 && delta[2] === 3) {
          return "moved";
        }
      } else if ((typeof delta === "undefined" ? "undefined" : _typeof(delta)) === "object") {
        return "node";
      }
      return "unknown";
    }
  }, {
    key: "parseTextDiff",
    value: function parseTextDiff(value) {
      var output = [];
      var lines = value.split("\n@@ ");
      for (var i = 0, l = lines.length; i < l; i++) {
        var line = lines[i];
        var lineOutput = {
          pieces: []
        };
        var location = /^(?:@@ )?[-+]?(\d+),(\d+)/.exec(line).slice(1);
        lineOutput.location = {
          line: location[0],
          chr: location[1]
        };
        var pieces = line.split("\n").slice(1);
        for (var pieceIndex = 0, piecesLength = pieces.length; pieceIndex < piecesLength; pieceIndex++) {
          var piece = pieces[pieceIndex];
          if (!piece.length) {
            continue;
          }
          var pieceOutput = {
            type: "context"
          };
          if (piece.substr(0, 1) === "+") {
            pieceOutput.type = "added";
          } else if (piece.substr(0, 1) === "-") {
            pieceOutput.type = "deleted";
          }
          pieceOutput.text = piece.slice(1);
          lineOutput.pieces.push(pieceOutput);
        }
        output.push(lineOutput);
      }
      return output;
    }
  }]);
  return BaseFormatter2;
}();
var base = Object.freeze({
  default: BaseFormatter
});
var HtmlFormatter = function(_BaseFormatter) {
  inherits(HtmlFormatter2, _BaseFormatter);
  function HtmlFormatter2() {
    classCallCheck(this, HtmlFormatter2);
    return possibleConstructorReturn(this, (HtmlFormatter2.__proto__ || Object.getPrototypeOf(HtmlFormatter2)).apply(this, arguments));
  }
  createClass(HtmlFormatter2, [{
    key: "typeFormattterErrorFormatter",
    value: function typeFormattterErrorFormatter(context, err) {
      context.out('<pre class="jsondiffpatch-error">' + err + "</pre>");
    }
  }, {
    key: "formatValue",
    value: function formatValue(context, value) {
      context.out("<pre>" + htmlEscape(JSON.stringify(value, null, 2)) + "</pre>");
    }
  }, {
    key: "formatTextDiffString",
    value: function formatTextDiffString(context, value) {
      var lines = this.parseTextDiff(value);
      context.out('<ul class="jsondiffpatch-textdiff">');
      for (var i = 0, l = lines.length; i < l; i++) {
        var line = lines[i];
        context.out('<li><div class="jsondiffpatch-textdiff-location">' + ('<span class="jsondiffpatch-textdiff-line-number">' + line.location.line + '</span><span class="jsondiffpatch-textdiff-char">' + line.location.chr + '</span></div><div class="jsondiffpatch-textdiff-line">'));
        var pieces = line.pieces;
        for (var pieceIndex = 0, piecesLength = pieces.length; pieceIndex < piecesLength; pieceIndex++) {
          var piece = pieces[pieceIndex];
          context.out('<span class="jsondiffpatch-textdiff-' + piece.type + '">' + htmlEscape(decodeURI(piece.text)) + "</span>");
        }
        context.out("</div></li>");
      }
      context.out("</ul>");
    }
  }, {
    key: "rootBegin",
    value: function rootBegin(context, type, nodeType) {
      var nodeClass = "jsondiffpatch-" + type + (nodeType ? " jsondiffpatch-child-node-type-" + nodeType : "");
      context.out('<div class="jsondiffpatch-delta ' + nodeClass + '">');
    }
  }, {
    key: "rootEnd",
    value: function rootEnd(context) {
      context.out("</div>" + (context.hasArrows ? '<script type="text/javascript">setTimeout(' + (adjustArrows.toString() + ",10);<\/script>") : ""));
    }
  }, {
    key: "nodeBegin",
    value: function nodeBegin(context, key, leftKey, type, nodeType) {
      var nodeClass = "jsondiffpatch-" + type + (nodeType ? " jsondiffpatch-child-node-type-" + nodeType : "");
      context.out('<li class="' + nodeClass + '" data-key="' + leftKey + '">' + ('<div class="jsondiffpatch-property-name">' + leftKey + "</div>"));
    }
  }, {
    key: "nodeEnd",
    value: function nodeEnd(context) {
      context.out("</li>");
    }
  }, {
    key: "format_unchanged",
    value: function format_unchanged(context, delta, left) {
      if (typeof left === "undefined") {
        return;
      }
      context.out('<div class="jsondiffpatch-value">');
      this.formatValue(context, left);
      context.out("</div>");
    }
  }, {
    key: "format_movedestination",
    value: function format_movedestination(context, delta, left) {
      if (typeof left === "undefined") {
        return;
      }
      context.out('<div class="jsondiffpatch-value">');
      this.formatValue(context, left);
      context.out("</div>");
    }
  }, {
    key: "format_node",
    value: function format_node(context, delta, left) {
      var nodeType = delta._t === "a" ? "array" : "object";
      context.out('<ul class="jsondiffpatch-node jsondiffpatch-node-type-' + nodeType + '">');
      this.formatDeltaChildren(context, delta, left);
      context.out("</ul>");
    }
  }, {
    key: "format_added",
    value: function format_added(context, delta) {
      context.out('<div class="jsondiffpatch-value">');
      this.formatValue(context, delta[0]);
      context.out("</div>");
    }
  }, {
    key: "format_modified",
    value: function format_modified(context, delta) {
      context.out('<div class="jsondiffpatch-value jsondiffpatch-left-value">');
      this.formatValue(context, delta[0]);
      context.out('</div><div class="jsondiffpatch-value jsondiffpatch-right-value">');
      this.formatValue(context, delta[1]);
      context.out("</div>");
    }
  }, {
    key: "format_deleted",
    value: function format_deleted(context, delta) {
      context.out('<div class="jsondiffpatch-value">');
      this.formatValue(context, delta[0]);
      context.out("</div>");
    }
  }, {
    key: "format_moved",
    value: function format_moved(context, delta) {
      context.out('<div class="jsondiffpatch-value">');
      this.formatValue(context, delta[0]);
      context.out('</div><div class="jsondiffpatch-moved-destination">' + delta[1] + "</div>");
      context.out(
        '<div class="jsondiffpatch-arrow" style="position: relative; left: -34px;">\n          <svg width="30" height="60" style="position: absolute; display: none;">\n          <defs>\n              <marker id="markerArrow" markerWidth="8" markerHeight="8"\n                 refx="2" refy="4"\n                     orient="auto" markerUnits="userSpaceOnUse">\n                  <path d="M1,1 L1,7 L7,4 L1,1" style="fill: #339;" />\n              </marker>\n          </defs>\n          <path d="M30,0 Q-10,25 26,50"\n            style="stroke: #88f; stroke-width: 2px; fill: none; stroke-opacity: 0.5; marker-end: url(#markerArrow);"\n          ></path>\n          </svg>\n      </div>'
      );
      context.hasArrows = true;
    }
  }, {
    key: "format_textdiff",
    value: function format_textdiff(context, delta) {
      context.out('<div class="jsondiffpatch-value">');
      this.formatTextDiffString(context, delta[0]);
      context.out("</div>");
    }
  }]);
  return HtmlFormatter2;
}(BaseFormatter);
function htmlEscape(text) {
  var html2 = text;
  var replacements = [[/&/g, "&amp;"], [/</g, "&lt;"], [/>/g, "&gt;"], [/'/g, "&apos;"], [/"/g, "&quot;"]];
  for (var i = 0; i < replacements.length; i++) {
    html2 = html2.replace(replacements[i][0], replacements[i][1]);
  }
  return html2;
}
var adjustArrows = function jsondiffpatchHtmlFormatterAdjustArrows(nodeArg) {
  var node = nodeArg || document;
  var getElementText = function getElementText2(_ref) {
    var textContent = _ref.textContent, innerText = _ref.innerText;
    return textContent || innerText;
  };
  var eachByQuery = function eachByQuery2(el, query, fn) {
    var elems = el.querySelectorAll(query);
    for (var i = 0, l = elems.length; i < l; i++) {
      fn(elems[i]);
    }
  };
  var eachChildren = function eachChildren2(_ref2, fn) {
    var children = _ref2.children;
    for (var i = 0, l = children.length; i < l; i++) {
      fn(children[i], i);
    }
  };
  eachByQuery(node, ".jsondiffpatch-arrow", function(_ref3) {
    var parentNode = _ref3.parentNode, children = _ref3.children, style = _ref3.style;
    var arrowParent = parentNode;
    var svg = children[0];
    var path = svg.children[1];
    svg.style.display = "none";
    var destination = getElementText(arrowParent.querySelector(".jsondiffpatch-moved-destination"));
    var container = arrowParent.parentNode;
    var destinationElem = void 0;
    eachChildren(container, function(child) {
      if (child.getAttribute("data-key") === destination) {
        destinationElem = child;
      }
    });
    if (!destinationElem) {
      return;
    }
    try {
      var distance = destinationElem.offsetTop - arrowParent.offsetTop;
      svg.setAttribute("height", Math.abs(distance) + 6);
      style.top = -8 + (distance > 0 ? 0 : distance) + "px";
      var curve = distance > 0 ? "M30,0 Q-10," + Math.round(distance / 2) + " 26," + (distance - 4) : "M30," + -distance + " Q-10," + Math.round(-distance / 2) + " 26,4";
      path.setAttribute("d", curve);
      svg.style.display = "";
    } catch (err) {
    }
  });
};
var showUnchanged = function showUnchanged2(show, node, delay) {
  var el = node || document.body;
  var prefix = "jsondiffpatch-unchanged-";
  var classes = {
    showing: prefix + "showing",
    hiding: prefix + "hiding",
    visible: prefix + "visible",
    hidden: prefix + "hidden"
  };
  var list = el.classList;
  if (!list) {
    return;
  }
  if (!delay) {
    list.remove(classes.showing);
    list.remove(classes.hiding);
    list.remove(classes.visible);
    list.remove(classes.hidden);
    if (show === false) {
      list.add(classes.hidden);
    }
    return;
  }
  if (show === false) {
    list.remove(classes.showing);
    list.add(classes.visible);
    setTimeout(function() {
      list.add(classes.hiding);
    }, 10);
  } else {
    list.remove(classes.hiding);
    list.add(classes.showing);
    list.remove(classes.hidden);
  }
  var intervalId = setInterval(function() {
    adjustArrows(el);
  }, 100);
  setTimeout(function() {
    list.remove(classes.showing);
    list.remove(classes.hiding);
    if (show === false) {
      list.add(classes.hidden);
      list.remove(classes.visible);
    } else {
      list.add(classes.visible);
      list.remove(classes.hidden);
    }
    setTimeout(function() {
      list.remove(classes.visible);
      clearInterval(intervalId);
    }, delay + 400);
  }, delay);
};
var hideUnchanged = function hideUnchanged2(node, delay) {
  return showUnchanged(false, node, delay);
};
var defaultInstance = void 0;
function format(delta, left) {
  if (!defaultInstance) {
    defaultInstance = new HtmlFormatter();
  }
  return defaultInstance.format(delta, left);
}
var html = Object.freeze({
  showUnchanged,
  hideUnchanged,
  default: HtmlFormatter,
  format
});
var AnnotatedFormatter = function(_BaseFormatter) {
  inherits(AnnotatedFormatter2, _BaseFormatter);
  function AnnotatedFormatter2() {
    classCallCheck(this, AnnotatedFormatter2);
    var _this = possibleConstructorReturn(this, (AnnotatedFormatter2.__proto__ || Object.getPrototypeOf(AnnotatedFormatter2)).call(this));
    _this.includeMoveDestinations = false;
    return _this;
  }
  createClass(AnnotatedFormatter2, [{
    key: "prepareContext",
    value: function prepareContext(context) {
      get(AnnotatedFormatter2.prototype.__proto__ || Object.getPrototypeOf(AnnotatedFormatter2.prototype), "prepareContext", this).call(this, context);
      context.indent = function(levels) {
        this.indentLevel = (this.indentLevel || 0) + (typeof levels === "undefined" ? 1 : levels);
        this.indentPad = new Array(this.indentLevel + 1).join("&nbsp;&nbsp;");
      };
      context.row = function(json, htmlNote) {
        context.out('<tr><td style="white-space: nowrap;"><pre class="jsondiffpatch-annotated-indent" style="display: inline-block">');
        context.out(context.indentPad);
        context.out('</pre><pre style="display: inline-block">');
        context.out(json);
        context.out('</pre></td><td class="jsondiffpatch-delta-note"><div>');
        context.out(htmlNote);
        context.out("</div></td></tr>");
      };
    }
  }, {
    key: "typeFormattterErrorFormatter",
    value: function typeFormattterErrorFormatter(context, err) {
      context.row("", '<pre class="jsondiffpatch-error">' + err + "</pre>");
    }
  }, {
    key: "formatTextDiffString",
    value: function formatTextDiffString(context, value) {
      var lines = this.parseTextDiff(value);
      context.out('<ul class="jsondiffpatch-textdiff">');
      for (var i = 0, l = lines.length; i < l; i++) {
        var line = lines[i];
        context.out('<li><div class="jsondiffpatch-textdiff-location">' + ('<span class="jsondiffpatch-textdiff-line-number">' + line.location.line + '</span><span class="jsondiffpatch-textdiff-char">' + line.location.chr + '</span></div><div class="jsondiffpatch-textdiff-line">'));
        var pieces = line.pieces;
        for (var pieceIndex = 0, piecesLength = pieces.length; pieceIndex < piecesLength; pieceIndex++) {
          var piece = pieces[pieceIndex];
          context.out('<span class="jsondiffpatch-textdiff-' + piece.type + '">' + piece.text + "</span>");
        }
        context.out("</div></li>");
      }
      context.out("</ul>");
    }
  }, {
    key: "rootBegin",
    value: function rootBegin(context, type, nodeType) {
      context.out('<table class="jsondiffpatch-annotated-delta">');
      if (type === "node") {
        context.row("{");
        context.indent();
      }
      if (nodeType === "array") {
        context.row('"_t": "a",', "Array delta (member names indicate array indices)");
      }
    }
  }, {
    key: "rootEnd",
    value: function rootEnd(context, type) {
      if (type === "node") {
        context.indent(-1);
        context.row("}");
      }
      context.out("</table>");
    }
  }, {
    key: "nodeBegin",
    value: function nodeBegin(context, key, leftKey, type, nodeType) {
      context.row("&quot;" + key + "&quot;: {");
      if (type === "node") {
        context.indent();
      }
      if (nodeType === "array") {
        context.row('"_t": "a",', "Array delta (member names indicate array indices)");
      }
    }
  }, {
    key: "nodeEnd",
    value: function nodeEnd(context, key, leftKey, type, nodeType, isLast) {
      if (type === "node") {
        context.indent(-1);
      }
      context.row("}" + (isLast ? "" : ","));
    }
  }, {
    key: "format_unchanged",
    value: function format_unchanged() {
    }
  }, {
    key: "format_movedestination",
    value: function format_movedestination() {
    }
  }, {
    key: "format_node",
    value: function format_node(context, delta, left) {
      this.formatDeltaChildren(context, delta, left);
    }
  }]);
  return AnnotatedFormatter2;
}(BaseFormatter);
var wrapPropertyName = function wrapPropertyName2(name) {
  return '<pre style="display:inline-block">&quot;' + name + "&quot;</pre>";
};
var deltaAnnotations = {
  added: function added(delta, left, key, leftKey) {
    var formatLegend = " <pre>([newValue])</pre>";
    if (typeof leftKey === "undefined") {
      return "new value" + formatLegend;
    }
    if (typeof leftKey === "number") {
      return "insert at index " + leftKey + formatLegend;
    }
    return "add property " + wrapPropertyName(leftKey) + formatLegend;
  },
  modified: function modified(delta, left, key, leftKey) {
    var formatLegend = " <pre>([previousValue, newValue])</pre>";
    if (typeof leftKey === "undefined") {
      return "modify value" + formatLegend;
    }
    if (typeof leftKey === "number") {
      return "modify at index " + leftKey + formatLegend;
    }
    return "modify property " + wrapPropertyName(leftKey) + formatLegend;
  },
  deleted: function deleted(delta, left, key, leftKey) {
    var formatLegend = " <pre>([previousValue, 0, 0])</pre>";
    if (typeof leftKey === "undefined") {
      return "delete value" + formatLegend;
    }
    if (typeof leftKey === "number") {
      return "remove index " + leftKey + formatLegend;
    }
    return "delete property " + wrapPropertyName(leftKey) + formatLegend;
  },
  moved: function moved(delta, left, key, leftKey) {
    return 'move from <span title="(position to remove at original state)">' + ("index " + leftKey + '</span> to <span title="(position to insert at final') + (' state)">index ' + delta[1] + "</span>");
  },
  textdiff: function textdiff(delta, left, key, leftKey) {
    var location = typeof leftKey === "undefined" ? "" : typeof leftKey === "number" ? " at index " + leftKey : " at property " + wrapPropertyName(leftKey);
    return "text diff" + location + ', format is <a href="https://code.google.com/p/google-diff-match-patch/wiki/Unidiff">a variation of Unidiff</a>';
  }
};
var formatAnyChange = function formatAnyChange2(context, delta) {
  var deltaType = this.getDeltaType(delta);
  var annotator = deltaAnnotations[deltaType];
  var htmlNote = annotator && annotator.apply(annotator, Array.prototype.slice.call(arguments, 1));
  var json = JSON.stringify(delta, null, 2);
  if (deltaType === "textdiff") {
    json = json.split("\\n").join('\\n"+\n   "');
  }
  context.indent();
  context.row(json, htmlNote);
  context.indent(-1);
};
AnnotatedFormatter.prototype.format_added = formatAnyChange;
AnnotatedFormatter.prototype.format_modified = formatAnyChange;
AnnotatedFormatter.prototype.format_deleted = formatAnyChange;
AnnotatedFormatter.prototype.format_moved = formatAnyChange;
AnnotatedFormatter.prototype.format_textdiff = formatAnyChange;
var defaultInstance$1 = void 0;
function format$1(delta, left) {
  if (!defaultInstance$1) {
    defaultInstance$1 = new AnnotatedFormatter();
  }
  return defaultInstance$1.format(delta, left);
}
var annotated = Object.freeze({
  default: AnnotatedFormatter,
  format: format$1
});
var OPERATIONS = {
  add: "add",
  remove: "remove",
  replace: "replace",
  move: "move"
};
var JSONFormatter = function(_BaseFormatter) {
  inherits(JSONFormatter2, _BaseFormatter);
  function JSONFormatter2() {
    classCallCheck(this, JSONFormatter2);
    var _this = possibleConstructorReturn(this, (JSONFormatter2.__proto__ || Object.getPrototypeOf(JSONFormatter2)).call(this));
    _this.includeMoveDestinations = true;
    return _this;
  }
  createClass(JSONFormatter2, [{
    key: "prepareContext",
    value: function prepareContext(context) {
      get(JSONFormatter2.prototype.__proto__ || Object.getPrototypeOf(JSONFormatter2.prototype), "prepareContext", this).call(this, context);
      context.result = [];
      context.path = [];
      context.pushCurrentOp = function(obj) {
        var op = obj.op, value = obj.value;
        var val = {
          op,
          path: this.currentPath()
        };
        if (typeof value !== "undefined") {
          val.value = value;
        }
        this.result.push(val);
      };
      context.pushMoveOp = function(to) {
        var from = this.currentPath();
        this.result.push({
          op: OPERATIONS.move,
          from,
          path: this.toPath(to)
        });
      };
      context.currentPath = function() {
        return "/" + this.path.join("/");
      };
      context.toPath = function(toPath) {
        var to = this.path.slice();
        to[to.length - 1] = toPath;
        return "/" + to.join("/");
      };
    }
  }, {
    key: "typeFormattterErrorFormatter",
    value: function typeFormattterErrorFormatter(context, err) {
      context.out("[ERROR] " + err);
    }
  }, {
    key: "rootBegin",
    value: function rootBegin() {
    }
  }, {
    key: "rootEnd",
    value: function rootEnd() {
    }
  }, {
    key: "nodeBegin",
    value: function nodeBegin(_ref, key, leftKey) {
      var path = _ref.path;
      path.push(leftKey);
    }
  }, {
    key: "nodeEnd",
    value: function nodeEnd(_ref2) {
      var path = _ref2.path;
      path.pop();
    }
  }, {
    key: "format_unchanged",
    value: function format_unchanged() {
    }
  }, {
    key: "format_movedestination",
    value: function format_movedestination() {
    }
  }, {
    key: "format_node",
    value: function format_node(context, delta, left) {
      this.formatDeltaChildren(context, delta, left);
    }
  }, {
    key: "format_added",
    value: function format_added(context, delta) {
      context.pushCurrentOp({ op: OPERATIONS.add, value: delta[0] });
    }
  }, {
    key: "format_modified",
    value: function format_modified(context, delta) {
      context.pushCurrentOp({ op: OPERATIONS.replace, value: delta[1] });
    }
  }, {
    key: "format_deleted",
    value: function format_deleted(context) {
      context.pushCurrentOp({ op: OPERATIONS.remove });
    }
  }, {
    key: "format_moved",
    value: function format_moved(context, delta) {
      var to = delta[1];
      context.pushMoveOp(to);
    }
  }, {
    key: "format_textdiff",
    value: function format_textdiff() {
      throw new Error("Not implemented");
    }
  }, {
    key: "format",
    value: function format4(delta, left) {
      var context = {};
      this.prepareContext(context);
      this.recurse(context, delta, left);
      return context.result;
    }
  }]);
  return JSONFormatter2;
}(BaseFormatter);
var last = function last2(arr) {
  return arr[arr.length - 1];
};
var sortBy = function sortBy2(arr, pred) {
  arr.sort(pred);
  return arr;
};
var compareByIndexDesc = function compareByIndexDesc2(indexA, indexB) {
  var lastA = parseInt(indexA, 10);
  var lastB = parseInt(indexB, 10);
  if (!(isNaN(lastA) || isNaN(lastB))) {
    return lastB - lastA;
  } else {
    return 0;
  }
};
var opsByDescendingOrder = function opsByDescendingOrder2(removeOps) {
  return sortBy(removeOps, function(a, b) {
    var splitA = a.path.split("/");
    var splitB = b.path.split("/");
    if (splitA.length !== splitB.length) {
      return splitA.length - splitB.length;
    } else {
      return compareByIndexDesc(last(splitA), last(splitB));
    }
  });
};
var partitionOps = function partitionOps2(arr, fns) {
  var initArr = Array(fns.length + 1).fill().map(function() {
    return [];
  });
  return arr.map(function(item) {
    var position = fns.map(function(fn) {
      return fn(item);
    }).indexOf(true);
    if (position < 0) {
      position = fns.length;
    }
    return { item, position };
  }).reduce(function(acc, item) {
    acc[item.position].push(item.item);
    return acc;
  }, initArr);
};
var isMoveOp = function isMoveOp2(_ref3) {
  var op = _ref3.op;
  return op === "move";
};
var isRemoveOp = function isRemoveOp2(_ref4) {
  var op = _ref4.op;
  return op === "remove";
};
var reorderOps = function reorderOps2(diff) {
  var _partitionOps = partitionOps(diff, [isMoveOp, isRemoveOp]), _partitionOps2 = slicedToArray(_partitionOps, 3), moveOps = _partitionOps2[0], removedOps = _partitionOps2[1], restOps = _partitionOps2[2];
  var removeOpsReverse = opsByDescendingOrder(removedOps);
  return [].concat(toConsumableArray(removeOpsReverse), toConsumableArray(moveOps), toConsumableArray(restOps));
};
var defaultInstance$2 = void 0;
var format$2 = function format2(delta, left) {
  if (!defaultInstance$2) {
    defaultInstance$2 = new JSONFormatter();
  }
  return reorderOps(defaultInstance$2.format(delta, left));
};
var log = function log2(delta, left) {
  console.log(format$2(delta, left));
};
var jsonpatch = Object.freeze({
  default: JSONFormatter,
  partitionOps,
  format: format$2,
  log
});
function chalkColor(name) {
  return chalk && chalk[name] || function() {
    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }
    return args;
  };
}
var colors = {
  added: chalkColor("green"),
  deleted: chalkColor("red"),
  movedestination: chalkColor("gray"),
  moved: chalkColor("yellow"),
  unchanged: chalkColor("gray"),
  error: chalkColor("white.bgRed"),
  textDiffLine: chalkColor("gray")
};
var ConsoleFormatter = function(_BaseFormatter) {
  inherits(ConsoleFormatter2, _BaseFormatter);
  function ConsoleFormatter2() {
    classCallCheck(this, ConsoleFormatter2);
    var _this = possibleConstructorReturn(this, (ConsoleFormatter2.__proto__ || Object.getPrototypeOf(ConsoleFormatter2)).call(this));
    _this.includeMoveDestinations = false;
    return _this;
  }
  createClass(ConsoleFormatter2, [{
    key: "prepareContext",
    value: function prepareContext(context) {
      get(ConsoleFormatter2.prototype.__proto__ || Object.getPrototypeOf(ConsoleFormatter2.prototype), "prepareContext", this).call(this, context);
      context.indent = function(levels) {
        this.indentLevel = (this.indentLevel || 0) + (typeof levels === "undefined" ? 1 : levels);
        this.indentPad = new Array(this.indentLevel + 1).join("  ");
        this.outLine();
      };
      context.outLine = function() {
        this.buffer.push("\n" + (this.indentPad || ""));
      };
      context.out = function() {
        for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
          args[_key2] = arguments[_key2];
        }
        for (var i = 0, l = args.length; i < l; i++) {
          var lines = args[i].split("\n");
          var text = lines.join("\n" + (this.indentPad || ""));
          if (this.color && this.color[0]) {
            text = this.color[0](text);
          }
          this.buffer.push(text);
        }
      };
      context.pushColor = function(color) {
        this.color = this.color || [];
        this.color.unshift(color);
      };
      context.popColor = function() {
        this.color = this.color || [];
        this.color.shift();
      };
    }
  }, {
    key: "typeFormattterErrorFormatter",
    value: function typeFormattterErrorFormatter(context, err) {
      context.pushColor(colors.error);
      context.out("[ERROR]" + err);
      context.popColor();
    }
  }, {
    key: "formatValue",
    value: function formatValue(context, value) {
      context.out(JSON.stringify(value, null, 2));
    }
  }, {
    key: "formatTextDiffString",
    value: function formatTextDiffString(context, value) {
      var lines = this.parseTextDiff(value);
      context.indent();
      for (var i = 0, l = lines.length; i < l; i++) {
        var line = lines[i];
        context.pushColor(colors.textDiffLine);
        context.out(line.location.line + "," + line.location.chr + " ");
        context.popColor();
        var pieces = line.pieces;
        for (var pieceIndex = 0, piecesLength = pieces.length; pieceIndex < piecesLength; pieceIndex++) {
          var piece = pieces[pieceIndex];
          context.pushColor(colors[piece.type]);
          context.out(piece.text);
          context.popColor();
        }
        if (i < l - 1) {
          context.outLine();
        }
      }
      context.indent(-1);
    }
  }, {
    key: "rootBegin",
    value: function rootBegin(context, type, nodeType) {
      context.pushColor(colors[type]);
      if (type === "node") {
        context.out(nodeType === "array" ? "[" : "{");
        context.indent();
      }
    }
  }, {
    key: "rootEnd",
    value: function rootEnd(context, type, nodeType) {
      if (type === "node") {
        context.indent(-1);
        context.out(nodeType === "array" ? "]" : "}");
      }
      context.popColor();
    }
  }, {
    key: "nodeBegin",
    value: function nodeBegin(context, key, leftKey, type, nodeType) {
      context.pushColor(colors[type]);
      context.out(leftKey + ": ");
      if (type === "node") {
        context.out(nodeType === "array" ? "[" : "{");
        context.indent();
      }
    }
  }, {
    key: "nodeEnd",
    value: function nodeEnd(context, key, leftKey, type, nodeType, isLast) {
      if (type === "node") {
        context.indent(-1);
        context.out(nodeType === "array" ? "]" : "}" + (isLast ? "" : ","));
      }
      if (!isLast) {
        context.outLine();
      }
      context.popColor();
    }
  }, {
    key: "format_unchanged",
    value: function format_unchanged(context, delta, left) {
      if (typeof left === "undefined") {
        return;
      }
      this.formatValue(context, left);
    }
  }, {
    key: "format_movedestination",
    value: function format_movedestination(context, delta, left) {
      if (typeof left === "undefined") {
        return;
      }
      this.formatValue(context, left);
    }
  }, {
    key: "format_node",
    value: function format_node(context, delta, left) {
      this.formatDeltaChildren(context, delta, left);
    }
  }, {
    key: "format_added",
    value: function format_added(context, delta) {
      this.formatValue(context, delta[0]);
    }
  }, {
    key: "format_modified",
    value: function format_modified(context, delta) {
      context.pushColor(colors.deleted);
      this.formatValue(context, delta[0]);
      context.popColor();
      context.out(" => ");
      context.pushColor(colors.added);
      this.formatValue(context, delta[1]);
      context.popColor();
    }
  }, {
    key: "format_deleted",
    value: function format_deleted(context, delta) {
      this.formatValue(context, delta[0]);
    }
  }, {
    key: "format_moved",
    value: function format_moved(context, delta) {
      context.out("==> " + delta[1]);
    }
  }, {
    key: "format_textdiff",
    value: function format_textdiff(context, delta) {
      this.formatTextDiffString(context, delta[0]);
    }
  }]);
  return ConsoleFormatter2;
}(BaseFormatter);
var defaultInstance$3 = void 0;
var format$3 = function format3(delta, left) {
  if (!defaultInstance$3) {
    defaultInstance$3 = new ConsoleFormatter();
  }
  return defaultInstance$3.format(delta, left);
};
function log$1(delta, left) {
  console.log(format$3(delta, left));
}
var console$1 = Object.freeze({
  default: ConsoleFormatter,
  format: format$3,
  log: log$1
});
Object.freeze({
  base,
  html,
  annotated,
  jsonpatch,
  console: console$1
});
function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {
  try {
    var info = gen[key](arg);
    var value = info.value;
  } catch (error) {
    reject(error);
    return;
  }
  if (info.done) {
    resolve(value);
  } else {
    Promise.resolve(value).then(_next, _throw);
  }
}
function _asyncToGenerator(fn) {
  return function() {
    var self = this, args = arguments;
    return new Promise(function(resolve, reject) {
      var gen = fn.apply(self, args);
      function _next(value) {
        asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value);
      }
      function _throw(err) {
        asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err);
      }
      _next(void 0);
    });
  };
}
function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}
function _defineProperties(target, props) {
  for (var i = 0; i < props.length; i++) {
    var descriptor = props[i];
    descriptor.enumerable = descriptor.enumerable || false;
    descriptor.configurable = true;
    if ("value" in descriptor)
      descriptor.writable = true;
    Object.defineProperty(target, descriptor.key, descriptor);
  }
}
function _createClass(Constructor, protoProps, staticProps) {
  if (protoProps)
    _defineProperties(Constructor.prototype, protoProps);
  if (staticProps)
    _defineProperties(Constructor, staticProps);
  return Constructor;
}
function _defineProperty(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, { value, enumerable: true, configurable: true, writable: true });
  } else {
    obj[key] = value;
  }
  return obj;
}
var JsonDiffMain = /* @__PURE__ */ function() {
  function JsonDiffMain2() {
    _classCallCheck(this, JsonDiffMain2);
    _defineProperty(this, "diffPatcher", new DiffPatcher({
      arrays: {
        detectMove: false
      },
      textDiff: {
        minLength: 1
      }
    }));
    _defineProperty(this, "scheduler", new IdleScheduler());
  }
  _createClass(JsonDiffMain2, [{
    key: "diff",
    value: function() {
      var _diff = _asyncToGenerator(/* @__PURE__ */ regenerator.mark(function _callee(input) {
        return regenerator.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                _context.next = 2;
                return this.scheduler.request();
              case 2:
                return _context.abrupt("return", {
                  id: input.id,
                  delta: this.diffPatcher.diff(input.a, input.b)
                });
              case 3:
              case "end":
                return _context.stop();
            }
          }
        }, _callee, this);
      }));
      function diff(_x) {
        return _diff.apply(this, arguments);
      }
      return diff;
    }()
  }]);
  return JsonDiffMain2;
}();
export { JsonDiffMain };
