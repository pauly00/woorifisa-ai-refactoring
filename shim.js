// shim.js (수정본)
(function() {
    // 1. 기본 설정 함수 연결
    window.module = QUnit.module;
    window.test = QUnit.test;

    // 2. [핵심] 대리인 함수 만들기
    // "지금 실행 중인 테스트(QUnit.config.current)를 찾아서 그 안의 assert에게 전달해라"
    function proxy(methodName) {
        return function() {
            // 현재 실행 중인 테스트의 'assert' 객체를 가져옴
            var assert = QUnit.config.current.assert;
            // 그 객체의 함수를 실행 (예: assert.equal(...))
            return assert[methodName].apply(assert, arguments);
        };
    }

    // 3. 검증 함수들을 대리인에 연결
    window.ok = proxy('ok');
    window.equal = proxy('equal');
    window.notEqual = proxy('notEqual');
    window.deepEqual = proxy('deepEqual');
    window.notDeepEqual = proxy('notDeepEqual');
    window.strictEqual = proxy('strictEqual');
    window.notStrictEqual = proxy('notStrictEqual');

    // 4. 옛날 이름(equals)도 equal로 연결
    window.equals = proxy('equal'); 
})();