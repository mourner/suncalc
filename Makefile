NODE?=	node

.PHONY : default build clean test
default: build test

build: suncalc.min.js

clean:
	rm -f *.min.js

test: test.js suncalc.js
	jshint $^
	node "$<" | faucet

%.min.js: %.js
	uglifyjs "$<" --output "$@" --comments '/mourner\/suncalc/'  --lint
