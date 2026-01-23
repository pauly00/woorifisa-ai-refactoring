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

((root) => {

	/* --- Setup --- */

	const lib = {};

	lib.version = '0.4.2';

	/* --- Exposed settings --- */

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

	/* --- Internal Helper Methods --- */

	const nativeMap = Array.prototype.map;
	const nativeIsArray = Array.isArray;
	const toString = Object.prototype.toString;

	const isString = (obj) => !!(obj === '' || (obj && obj.charCodeAt && obj.substr));

	const isArray = (obj) => nativeIsArray ? nativeIsArray(obj) : toString.call(obj) === '[object Array]';

	const isObject = (obj) => obj && toString.call(obj) === '[object Object]';

	const defaults = (object = {}, defs = {}) => {
		for (const key in defs) {
			if (defs.hasOwnProperty(key) && object[key] == null) {
				object[key] = defs[key];
			}
		}
		return object;
	};

	const map = (obj, iterator, context) => {
		const results = [];
		if (!obj) return results;
		if (nativeMap && obj.map === nativeMap) return obj.map(iterator, context);
		for (let i = 0, j = obj.length; i < j; i++) {
			results[i] = iterator.call(context, obj[i], i, obj);
		}
		return results;
	};

	const checkPrecision = (val, base) => {
		val = Math.round(Math.abs(val));
		return isNaN(val) ? base : val;
	};

	const checkCurrencyFormat = (format) => {
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
	};

	/* --- API Methods --- */

	const unformat = lib.unformat = lib.parse = (value, decimal) => {
		if (isArray(value)) {
			return map(value, (val) => unformat(val, decimal));
		}
		value = value || 0;
		if (typeof value === "number") return value;
		decimal = decimal || lib.settings.number.decimal;
		const regex = new RegExp("[^0-9-" + decimal + "]", ["g"]);
		const unformatted = parseFloat(
			("" + value)
			.replace(/\((?=\d+)(.*)\)/, "-$1")
			.replace(regex, '')
			.replace(decimal, '.')
		);
		return !isNaN(unformatted) ? unformatted : 0;
	};

	const toFixed = lib.toFixed = (value, precision) => {
		precision = checkPrecision(precision, lib.settings.number.precision);
		const exponentialForm = Number(lib.unformat(value) + 'e' + precision);
		const rounded = Math.round(exponentialForm);
		const finalResult = Number(rounded + 'e-' + precision).toFixed(precision);
		return finalResult;
	};

	const formatNumber = lib.formatNumber = lib.format = (number, precision, thousand, decimal) => {
		if (isArray(number)) {
			return map(number, (val) => formatNumber(val, precision, thousand, decimal));
		}
		number = unformat(number);
		const opts = defaults(
			(isObject(precision) ? precision : {
				precision: precision,
				thousand: thousand,
				decimal: decimal
			}),
			lib.settings.number
		);
		const usePrecision = checkPrecision(opts.precision);
		const negative = number < 0 ? "-" : "";
		const base = parseInt(toFixed(Math.abs(number || 0), usePrecision), 10) + "";
		const mod = base.length > 3 ? base.length % 3 : 0;
		return negative + (mod ? base.substr(0, mod) + opts.thousand : "") + base.substr(mod).replace(/(\d{3})(?=\d)/g, "$1" + opts.thousand) + (usePrecision ? opts.decimal + toFixed(Math.abs(number), usePrecision).split('.')[1] : "");
	};

	const formatMoney = lib.formatMoney = (number, symbol, precision, thousand, decimal, format) => {
		if (isArray(number)) {
			return map(number, (val) => formatMoney(val, symbol, precision, thousand, decimal, format));
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
		);
		const formats = checkCurrencyFormat(opts.format);
		const useFormat = number > 0 ? formats.pos : number < 0 ? formats.neg : formats.zero;
		return useFormat.replace('%s', opts.symbol).replace('%v', formatNumber(Math.abs(number), checkPrecision(opts.precision), opts.thousand, opts.decimal));
	};

	lib.formatColumn = (list, symbol, precision, thousand, decimal, format) => {
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
		);
		const formats = checkCurrencyFormat(opts.format);
		const padAfterSymbol = formats.pos.indexOf("%s") < formats.pos.indexOf("%v");
		let maxLength = 0;
		const formatted = map(list, (val) => {
			if (isArray(val)) {
				return lib.formatColumn(val, opts);
			} else {
				val = unformat(val);
				const useFormat = val > 0 ? formats.pos : val < 0 ? formats.neg : formats.zero;
				const fVal = useFormat.replace('%s', opts.symbol).replace('%v', formatNumber(Math.abs(val), checkPrecision(opts.precision), opts.thousand, opts.decimal));
				if (fVal.length > maxLength) maxLength = fVal.length;
				return fVal;
			}
		});
		return map(formatted, (val) => {
			if (isString(val) && val.length < maxLength) {
				return padAfterSymbol ? val.replace(opts.symbol, opts.symbol + (new Array(maxLength - val.length + 1).join(" "))) : (new Array(maxLength - val.length + 1).join(" ")) + val;
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
		lib.noConflict = ((oldAccounting) => () => {
			root.accounting = oldAccounting;
			lib.noConflict = undefined;
			return lib;
		})(root.accounting);
		root['accounting'] = lib;
	}

})(this);