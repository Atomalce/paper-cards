(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.PaperCardsCore = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var MAX = 500, FIELDS = { id: 1, question: 1, answer: 1, known: 1 };
  function len(s) { return Array.from(s).length; }
  function err(msg) { throw new Error(msg); }

  function validateCards(value) {
    if (!Array.isArray(value)) err('cards 必须是数组');
    if (value.length > MAX) err('卡片数量不能超过 ' + MAX);
    var seen = Object.create(null), result = [];
    for (var i = 0; i < value.length; i++) {
      var c = value[i], n = i + 1;
      if (c === null || typeof c !== 'object' || Array.isArray(c)) err('第 ' + n + ' 张卡片不是对象');
      var keys = Object.keys(c);
      for (var k = 0; k < keys.length; k++) {
        if (!Object.prototype.hasOwnProperty.call(FIELDS, keys[k])) err('第 ' + n + ' 张卡片含非法字段: ' + keys[k]);
      }
      var id = c.id;
      if (typeof id !== 'string' || id.length === 0) err('第 ' + n + ' 张卡片 id 必须为非空字符串');
      if (len(id) > 80) err('第 ' + n + ' 张卡片 id 长度不能超过 80');
      if (seen[id]) err('第 ' + n + ' 张卡片 id 重复: ' + id);
      seen[id] = 1;
      if (typeof c.question !== 'string') err('第 ' + n + ' 张卡片 question 必须为字符串');
      var q = c.question.trim(), ql = len(q);
      if (ql < 1 || ql > 200) err('第 ' + n + ' 张卡片 question 长度需在 1-200 之间');
      if (typeof c.answer !== 'string') err('第 ' + n + ' 张卡片 answer 必须为字符串');
      var a = c.answer.trim(), al = len(a);
      if (al < 1 || al > 2000) err('第 ' + n + ' 张卡片 answer 长度需在 1-2000 之间');
      if (typeof c.known !== 'boolean') err('第 ' + n + ' 张卡片 known 必须为布尔值');
      result.push({ id: id, question: q, answer: a, known: c.known });
    }
    return result;
  }

  function filterCards(cards, mode, query) {
    if (mode !== 'all' && mode !== 'new' && mode !== 'known') err('未知筛选模式: ' + mode);
    var q = (typeof query === 'string' ? query : '').toLowerCase(), out = [];
    for (var i = 0; i < cards.length; i++) {
      var c = cards[i];
      if (mode === 'new' && c.known !== false) continue;
      if (mode === 'known' && c.known !== true) continue;
      if (q && (c.question || '').toLowerCase().indexOf(q) === -1 && (c.answer || '').toLowerCase().indexOf(q) === -1) continue;
      out.push(c);
    }
    return out;
  }

  return { validateCards: validateCards, filterCards: filterCards };
}));
