/*!
 * accounting.js v0.4.2
 * Copyright 2014 Open Exchange Rates
 *
 * Freely distributable under the MIT license.
 * Portions of accounting.js are inspired or borrowed from underscore.js
 *
 * Full details and documentation:
 * http://openexchangerates.github.io/accounting.js/
 */

(function(root, undefined) {

	/* --- Setup --- */

	const lib = {};
	lib.version = '0.4.2';

	lib.settings = {
		currency: {
			symbol: "$",
			format: "%s%v",
			decimal: ".",
			thousand: ",",
			precision: 2,
			grouping: 3
		},
		number: {
			precision: 0,
			grouping: 3,
			thousand: ",",
			decimal: "."
		}
	};

	const nativeMap = Array.prototype.map,
		nativeIsArray = Array.isArray,
		toString = Object.prototype.toString;

	const isString = obj => !!(obj === '' || (obj && obj.charCodeAt && obj.substr));
	const isArray = obj => nativeIsArray ? nativeIsArray(obj) : toString.call(obj) === '[object Array]';
	const isObject = obj => obj && toString.call(obj) === '[object Object]';

	function defaults(object, defs) {
		object = object || {};
		defs = defs || {};
		for (let key in defs) {
			if (defs.hasOwnProperty(key) && object[key] == null) {
				object[key] = defs[key];
			}
		}
		return object;
	}

	function map(obj, iterator, context) {
		const results = [];
		if (!obj) return results;
		if (nativeMap && obj.map === nativeMap) return obj.map(iterator, context);
		for (let i = 0, j = obj.length; i < j; i++) {
			results[i] = iterator.call(context, obj[i], i, obj);
		}
		return results;
	}

	const checkPrecision = (val, base) => isNaN(val = Math.round(Math.abs(val))) ? base : val;

	function checkCurrencyFormat(format) {
		const defaults = lib.settings.currency.format;
		if (typeof format === "function") format = format();
		if (isString(format) && format.match("%v")) {
			return {
				pos: format,
				neg: format.replace("-", "").replace("%v", "-%v"),
				zero: format
			};
		} else if (!format || !format.pos || !format.pos.match("%v")) {
			return (!isString(defaults)) ? defaults : lib.settings.currency.format = {
				pos: defaults,
				neg: defaults.replace("%v", "-%v"),
				zero: defaults
			};
		}
		return format;
	}

	const unformat = lib.unformat = lib.parse = function(value, decimal) {
		if (isArray(value)) {
			return map(value, val => unformat(val, decimal));
		}
		value = value || 0;
		if (typeof value === "number") return value;
		decimal = decimal || lib.settings.number.decimal;
		const regex = new RegExp("[^0-9-" + decimal + "]", ["g"]),
			unformatted = parseFloat(
				("" + value)
				.replace(/\((?=\d+)(.*)\)/, "-$1")
				.replace(regex, '')
				.replace(decimal, '.')
			);
		return !isNaN(unformatted) ? unformatted : 0;
	};

	const toFixed = lib.toFixed = function(value, precision) {
		precision = checkPrecision(precision, lib.settings.number.precision);
		const exponentialForm = Number(lib.unformat(value) + 'e' + precision);
		const rounded = Math.round(exponentialForm);
		return Number(rounded + 'e-' + precision).toFixed(precision);
	};

	const formatNumber = lib.formatNumber = lib.format = function(number, precision, thousand, decimal) {
		if (isArray(number)) {
			return map(number, val => formatNumber(val, precision, thousand, decimal));
		}
		number = unformat(number);
		const opts = defaults(
				(isObject(precision) ? precision : {
					precision: precision,
					thousand: thousand,
					decimal: decimal
				}),
				lib.settings.number
			),
			usePrecision = checkPrecision(opts.precision),
			negative = number < 0 ? "-" : "",
			base = parseInt(toFixed(Math.abs(number || 0), usePrecision), 10) + "",
			mod = base.length > 3 ? base.length % 3 : 0;
		return negative + (mod ? base.substr(0, mod) + opts.thousand : "") + base.substr(mod).replace(/(\d{3})(?=\d)/g, "$1" + opts.thousand) + (usePrecision ? opts.decimal + toFixed(Math.abs(number), usePrecision).split('.')[1] : "");
	};

	const formatMoney = lib.formatMoney = function(number, symbol, precision, thousand, decimal, format) {
		if (isArray(number)) {
			return map(number, val => formatMoney(val, symbol, precision, thousand, decimal, format));
		}
		number = unformat(number);
		const opts = defaults(
				(isObject(symbol) ? symbol : {
					symbol: symbol,
					precision: precision,
					thousand: thousand,
					decimal: decimal,
					format: format
				}),
				lib.settings.currency
			),
			formats = checkCurrencyFormat(opts.format),
			useFormat = number > 0 ? formats.pos : number < 0 ? formats.neg : formats.zero;
		return useFormat.replace('%s', opts.symbol).replace('%v', formatNumber(Math.abs(number), checkPrecision(opts.precision), opts.thousand, opts.decimal));
	};

	lib.formatColumn = function(list, symbol, precision, thousand, decimal, format) {
		if (!list || !isArray(list)) return [];
		const opts = defaults(
				(isObject(symbol) ? symbol : {
					symbol: symbol,
					precision: precision,
					thousand: thousand,
					decimal: decimal,
					format: format
				}),
				lib.settings.currency
			),
			formats = checkCurrencyFormat(opts.format),
			padAfterSymbol = formats.pos.indexOf("%s") < formats.pos.indexOf("%v"),
			formatted = map(list, val => {
				if (isArray(val)) {
					return lib.formatColumn(val, opts);
				} else {
					val = unformat(val);
					const useFormat = val > 0 ? formats.pos : val < 0 ? formats.neg : formats.zero,
						fVal = useFormat.replace('%s', opts.symbol).replace('%v', formatNumber(Math.abs(val), checkPrecision(opts.precision), opts.thousand, opts.decimal));
					return fVal;
				}
			}),
			maxLength = Math.max(...formatted.map(val => isString(val) ? val.length : 0));
		return map(formatted, val => {
			if (isString(val) && val.length < maxLength) {
				return padAfterSymbol ? val.replace(opts.symbol, opts.symbol + " ".repeat(maxLength - val.length)) : " ".repeat(maxLength - val.length) + val;
			}
			return val;
		});
	};

	if (typeof exports !== 'undefined') {
		if (typeof module !== 'undefined' && module.exports) {
			exports = module.exports = lib;
		}
		exports.accounting = lib;
	} else if (typeof define === 'function' && define.amd) {
		define([], () => lib);
	} else {
		lib.noConflict = (function(oldAccounting) {
			return function() {
				root.accounting = oldAccounting;
				lib.noConflict = undefined;
				return lib;
			};
		})(root.accounting);
		root['accounting'] = lib;
	}

}(this));