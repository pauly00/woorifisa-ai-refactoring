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

        // accounting.js Line 120
        // : checkPrecision 함수 내 'return isNaN(val)? base : val;' 분기 검증
        equal(accounting.formatNumber(123.456, "invalid"), "123", "Invalid precision falls back to default base precision");

        // accounting.js Line 173 (위와 동일한 로직의 다른 케이스)
        equal(accounting.formatMoney(123, { format: "no-value-here" }), "$123.00", "Format string without %v falls back to default");
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


    // -------- 커버리지 높이기 위해 추가한 코드


    test("Recursive Array Support (unformat & formatMoney)", function() {
        // accounting.js Line 181 ~ 183
        // : unformat 함수의 'if (isArray(value))' 분기와 내부 재귀 호출 로직 검증
        var unformattedArr = accounting.unformat(["$1.00", "$2.50"]);
        deepEqual(unformattedArr, [1, 2.5], "unformat should handle arrays recursively");

        // ccounting.js Line 280 ~ 282
        // : formatMoney 함수의 'if (isArray(number))' 분기와 내부 재귀 호출 로직 검증
        var formattedMoneyArr = accounting.formatMoney([10, 20], "$", 0);
        deepEqual(formattedMoneyArr, ["$10", "$20"], "formatMoney should handle arrays recursively");
    });

    test("Internal map() fallback execution", function() {
        // accounting.js Line 116 ~ 118
        // : 내부 map 함수에서 nativeMap이 없을 때 실행되는 'for 루프(Fallback)' 검증
        // (배열이지만 .map 메서드가 없는 객체를 주입하여 강제로 for문을 돌게 만듦)

        var list = [1, 2];
        list.map = undefined; // 이 배열 인스턴스에서만 map을 숨김 (전역 오염 X)

        // formatNumber는 내부적으로 isArray()를 체크하므로 통과하고,
        // 그 다음 map()을 호출할 때 위에서 숨긴 것 때문에 fallback loop 타게 됨
        var result = accounting.formatNumber(list, 0);

        equal(result[0], "1", "Fallback loop executed: item 0");
        equal(result[1], "2", "Fallback loop executed: item 1");
    });

    test("checkCurrencyFormat() branches", function() {

        // 1. accounting.js Line 151: 'if ( typeof format === "function" )' 분기 검증
                var funcFormat = function() { return "%v %s"; };
        equal(accounting.formatMoney(100, { symbol: "krw", format: funcFormat }), "100.00 krw", "Function format supported");

        // 2. accounting.js Line 173 ~ 177: 'else if ( !format || ... )' 분기 검증
        // (유효하지 않은 포맷 객체가 들어왔을 때 기본값(defaults)을 사용하는 로직)
        var invalidFormat = { pos: "???" }; // %v가 없음
        equal(accounting.formatMoney(100, { symbol: "$", format: invalidFormat }), "$100.00", "Invalid format object falls back to default");
    });

    test("accounting.formatColumn() edge cases", function() {
        // null 처리 및 음수/0 분기

        // 1. accounting.js Line 325: 'if (!list || !isArray(list))' 분기 검증 (Null Safety)
        deepEqual(accounting.formatColumn(null), [], "Returns empty array for null list");

        // 2. accounting.js Line 358: 'val < 0 ? formats.neg : formats.zero' 분기 검증
        // (양수뿐만 아니라 음수와 0일 때 각각 다른 포맷을 적용하는지 확인)
        var list = [10, -10, 0];
        // pos, neg, zero 형식을 모두 다르게 지정
        var opts = {
            symbol: "$",
            format: { pos: "%s%v", neg: "(%s%v)", zero: "--" }
        };
        var result = accounting.formatColumn(list, opts);

        equal(result[1].replace(/\s/g, ''), "($10.00)", "Negative format applied"); // 공백 제거 후 비교
        ok(result[2].indexOf("--") > -1, "Zero format applied");
    });

    test("accounting.noConflict() safe test", function() {

        // accounting.js Line 398 ~ 406
        // : 'lib.noConflict' 함수 정의 및 내부 동작(전역 변수 복구) 검증

        var original = window.accounting; // 현재 상태 백업
        var lib = accounting.noConflict(); // 함수 실행

        // 검증: accounting이 삭제되었거나 이전 상태로 돌아갔는지 확인
        // (주의: 원래 window.accounting이 없었다면 undefined가 됨)
        ok(window.accounting !== lib, "Global accounting variable restored/removed");

        // 복구: 다음 테스트를 위해 다시 할당
        window.accounting = lib;
    });

});