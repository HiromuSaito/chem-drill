.PHONY: secrets-push secrets-pull secrets-init help

secrets-push: ## ローカルの .env.<STAGE> を SST に一括反映
	STAGE=$(STAGE) ./scripts/secrets.sh push

secrets-pull: ## SST から現在の値を取得して .env.<STAGE> に保存
	STAGE=$(STAGE) ./scripts/secrets.sh pull

secrets-init: ## SST のシークレットキー一覧から .env.<STAGE> テンプレートを生成
	STAGE=$(STAGE) ./scripts/secrets.sh init

help: ## ヘルプを表示
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'

.DEFAULT_GOAL := help
