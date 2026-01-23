$(document).ready(function() {

	module("Library Methods");

	test("accounting.unformat()", function() {
		equals(accounting.unformat("$12,345,678.90 USD"), 12345678.9, 'Can unformat currency to float');
		equals(accounting.unformat(1234567890), 1234567890, 'Returns same value when passed an integer');
		equals(accounting.unformat("string"), 0, 'Returns 0 for a string with no numbers');
		equals(accounting.unformat({joss:1}), 0, 'Returns 0 for object');

		accounting.settings.number.decimal = ',';
		equals(accounting.unformat("100,00"), 100, 'Uses decimal separator from settings');
		equals(accounting.unformat("�1.000,00"), 1000, 'Uses decimal separator from settings');
		accounting.settings.number.decimal = '.';
	});

	test("accounting.toFixed()", function() {
		equals(accounting.toFixed(54321, 5), "54321.00000", 'Performs basic float zero-padding');
		equals(accounting.toFixed(0.615, 2), "0.62", 'Rounds 0.615 to "0.62" instead of "0.61"');
	});

	test("accounting.formatNumber()", function() {
		// Check custom precision and separators:
		equals(accounting.formatNumber(4999.99, 2, ".", ","), "4.999,99", 'Custom precision and decimal/thousand separators are a-ok')
		
		// check usage with options object parameter:
		equal(accounting.formatNumber(5318008, {
			precision : 3,
			thousand : "__",
			decimal : "--"
		}), "5__318__008--000", 'Correctly handles custom precision and separators passed in via second param options object');

		
		// check rounding:
		equals(accounting.formatNumber(0.615, 2), "0.62", 'Rounds 0.615 up to "0.62" with precision of 2');
		
		// manually and recursively formatted arrays should have same values:
		var numbers = [8008135, [1234, 5678], 1000];
		var formattedManually = [accounting.formatNumber(8008135), [accounting.formatNumber(1234), accounting.formatNumber(5678)], accounting.formatNumber(1000)];
		var formattedRecursively = accounting.formatNumber(numbers);
		equals(formattedRecursively.toString(), formattedManually.toString(), 'can recursively format multi-dimensional arrays');
	});


	test("accounting.formatMoney()", function() {
		equals(accounting.formatMoney(12345678), "$12,345,678.00", "Default usage with default parameters is ok");
		equals(accounting.formatMoney(4999.99, "$ ", 2, ".", ","), "$ 4.999,99", 'custom formatting via straight params works ok');
		equals(accounting.formatMoney(-500000, "� ", 0), "� -500,000", 'negative values, custom params, works ok');
		equals(accounting.formatMoney(5318008, { symbol: "GBP",  format: "%v %s" }), "5,318,008.00 GBP", "`format` parameter is observed in string output");
		equals(accounting.formatMoney(1000, { format: "test %v 123 %s test" }), "test 1,000.00 123 $ test", "`format` parameter is observed in string output, despite being rather strange");
		
		// Format param is an object:
		var format = {
			pos: "%s %v",
			neg: "%s (%v)",
			zero:"%s  --"
		}
		equals(accounting.formatMoney(0, { symbol: "GBP",  format:format}), "GBP  --", "`format` parameter provided given as an object with `zero` format, correctly observed in string output");
		equals(accounting.formatMoney(-1000, { symbol: "GBP",  format:format}), "GBP (1,000.00)", "`format` parameter provided given as an object with `neg` format, correctly observed in string output");
		equals(accounting.formatMoney(1000, { symbol: "GBP",  format:{neg:"--%v %s"}}), "GBP1,000.00", "`format` parameter provided, but only `neg` value provided - positive value should be formatted by default format (%s%v)");
		
		accounting.settings.currency.format = "%s%v";
		accounting.formatMoney(0, {format:""});
		equals(typeof accounting.settings.currency.format, "object", "`settings.currency.format` default string value should be reformatted to an object, the first time it is used");
	});


	test("accounting.formatColumn()", function() {
		// standard usage:
		var list = [123, 12345];
		equals(accounting.formatColumn(list, "$ ", 0).toString(), (["$    123", "$ 12,345"]).toString(), "formatColumn works as expected");


		// multi-dimensional array (formatColumn should be applied recursively):
		var list = [[1, 100], [900, 9]];
		equals(accounting.formatColumn(list).toString(), ([["$  1.00", "$100.00"], ["$900.00", "$  9.00"]]).toString(), "formatcolumn works on multi-dimensional array");


		// random numbers, must come back same length:
		var column = accounting.formatColumn([Math.random(), Math.random() * 1000, Math.random() * 10000000]);
		ok((column[0].length === column[2].length && column[1].length === column[2].length), "formatColumn() with 3 random numbers returned strings of matching length");


		// random numbers, must come back same length:
		var column = accounting.formatColumn([Math.random(), Math.random() * 1000, Math.random() * 10000000], {
			format: '(%v] --++== %s',
			thousand: ')(',
			decimal: ')[',
			precision: 3
		});
		ok((column[0].length === column[2].length && column[1].length === column[2].length), "formatColumn() with 3 random numbers returned strings of matching length, even with a weird custom `format` parameter");



	});


	// --------


	test("accounting.unformat() - Additional Branches", function() {
		// 수정됨: 입력값을 콤마가 소수점으로 쓰이는 형식("1.000,00")으로 변경
		var unformattedList = accounting.unformat(["1.000,00", "2.000,00 €"], ","); 
		deepEqual(unformattedList, [1000, 2000], "배열을 재귀적으로 unformat 하고 명시적인 decimal 인자를 처리함");
	
		equals(accounting.unformat("10.000,00", ","), 10000, "설정을 변경하지 않고 함수 인자로 decimal을 전달하여 처리");
	});


	test("accounting.toFixed() - Edge Cases", function() {
		// 수정됨: lib.settings -> accounting.settings 로 변경
		var defaultPrecision = accounting.settings.number.precision; 
		equals(accounting.toFixed(54.321, "invalid"), accounting.toFixed(54.321, defaultPrecision), "유효하지 않은 precision이 전달되면 기본 설정을 사용함");
	});


	test("accounting.formatMoney() - Format Branches", function() {
		// 1. format이 함수(Function)인 경우
		var funcFormat = function() {
			return "%s -- %v";
		};
		equals(accounting.formatMoney(100, { symbol: "$", format: funcFormat }), "$ -- 100.00", "format이 함수일 때 결과를 올바르게 처리함");
	
		// 2. format 객체가 유효하지 않은 경우 (pos에 %v가 없음) -> 기본값으로 Fallback
		// checkCurrencyFormat: else if ( !format || !format.pos || !format.pos.match("%v") ) 분기 진입
		var invalidFormat = { pos: "No value here" }; 
		// 기본 포맷(%s%v)이 적용되어야 함 ($100.00)
		equals(accounting.formatMoney(100, { symbol: "$", format: invalidFormat }), "$100.00", "유효하지 않은 format 객체가 전달되면 기본 포맷으로 fallback 됨");
	});



	test("accounting.formatColumn() - Additional Branches", function() {
		deepEqual(accounting.formatColumn(null), [], "null 입력 시 빈 배열 반환");
		deepEqual(accounting.formatColumn("not array"), [], "배열이 아닌 입력 시 빈 배열 반환");
	
		var nested = [[100], 200];
		var nestedResult = accounting.formatColumn(nested, "$", 0);
		equals(nestedResult[0][0], "$100", "중첩 배열 내부 값 포맷팅 확인");
	
		var list = [10, 1000];
		var opts = { format: "%v %s", symbol: "krw", precision: 0 };
		var result = accounting.formatColumn(list, opts);
		
		// "1,000 krw" (길이 9)
		// "10 krw" (길이 6) -> 길이 9를 맞추기 위해 공백 3개 필요 ("   10 krw")
		equals(result[1], "1,000 krw", "긴 문자열 확인");
		equals(result[0].length, result[1].length, "길이 일치 확인");
		
		// 수정됨: indexOf 대신 정확한 문자열 비교로 변경
		equals(result[0], "   10 krw", "앞쪽 공백 패딩 확인"); 
	});
	
});
