#!/bin/bash
# Скриншот страницы сайта через headless Edge.
# usage: shot.sh <имя> <ширина> <высота> <хэш> <папка>
# Для ширины меньше 500px страница оборачивается в iframe: Edge не уменьшает окно сильнее.
set -e
NAME="$1"; W="$2"; H="$3"; HASH="$4"; OUT="${5:-.}"
EDGE="/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"
[ -x "$EDGE" ] || EDGE="/c/Program Files/Microsoft/Edge/Application/msedge.exe"
ROOT="$(cd "$(dirname "$0")/../../../.." && pwd -W)"
PAGE="file:///$ROOT/index.html#$HASH"
mkdir -p "$OUT"
OUT_ABS="$(cd "$OUT" && pwd -W)"

TARGET="$PAGE"; WIN_W="$W"
if [ "$W" -lt 500 ]; then
    WRAP="$OUT_ABS/_wrap-$NAME.html"
    echo "<html><body style='margin:0'><iframe src='$PAGE' style='border:0;width:${W}px;height:${H}px;display:block'></iframe></body></html>" > "$WRAP"
    TARGET="file:///$WRAP"; WIN_W=500
fi

"$EDGE" --headless=new --disable-gpu --hide-scrollbars --virtual-time-budget=4000 \
    --window-size="$WIN_W,$H" --screenshot="$OUT_ABS/$NAME.png" "$TARGET" >/dev/null 2>&1
echo "$OUT_ABS/$NAME.png"
