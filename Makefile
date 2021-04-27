lint:
	./scripts/lint.sh

build:
	./scripts/build-all.sh

push: build
	./scripts/push-all.sh
