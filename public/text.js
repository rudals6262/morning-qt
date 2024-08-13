function parseReferences(refs) {
    return refs.split(',').map(ref => ref.trim());
}

window.addEventListener('load', function() {
    const references = "[창1:2-4], [창2:3], [창30], [시119], [벧후1]";
    const parsedRefs = parseReferences(references);

    if (parsedRefs.length === 0) {
        console.error('잘못된 참조 형식');
        return;
    }

    // API 호출하여 데이터 가져오기
    fetch('/.netlify/functions/api?references=' + encodeURIComponent(references))
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok ' + response.statusText);
            }
            return response.json();
        })
        .then(data => {
            if (!Array.isArray(data)) {
                throw new Error('Invalid data format received');
            }

            const container = document.getElementById('text');
            container.innerHTML = data.map(({ ref, rows, copyRef }) => {
                const shortLabelMatch = ref.match(/^\[(\D+)(\d+)/);
                const shortLabel = shortLabelMatch ? shortLabelMatch[1] : '';
                const chapter = shortLabelMatch ? shortLabelMatch[2] : '';
                const content = rows.map((row, index) => {
                    const sentence = row.sentence.replace(/<[^>]+>\s?/g, ''); // <> 괄호로 감싸진 부분과 뒤의 띄어쓰기 제거
                    const numberClass = rows.length === 1 ? 'transparent-number' : '';
                    return `
                        <div class="line" data-paragraph="${row.paragraph}" data-short-label="${shortLabel}">
                            <div class="number ${numberClass}">${row.paragraph}</div>
                            <div class="text">${sentence}</div>
                        </div>
                    `;
                }).join('');
                
                let displayRef = ref;
                if (shortLabel.startsWith('시')) {
                    displayRef = ref.replace('장', '편');
                } else if (!ref.includes(':') && ref.includes('장')) {
                    displayRef = `[${shortLabel}${chapter}장]`;
                } else {
                    displayRef = `[${shortLabel}${chapter}:${ref.split(':')[1]}`;
                }               
                
                return `<div class="reference" data-reference="${ref}" data-short-label="${shortLabel}" data-copy-ref="${copyRef}">${displayRef}</div>${content}`;
            }).join('<br>');

            const textElements = document.querySelectorAll('.line');
            const buttonContainer = document.getElementById('button-container');
            let startIndex = null;
            let endIndex = null;
            let currentShortLabelGlobal = null;  // 전역 변수로 설정

            textElements.forEach((el, index) => {
                el.addEventListener('click', function(e) {
                    e.preventDefault();
                    handleSelection(index);
                });
            });

            function handleSelection(index) {
                const currentEl = textElements[index];
                const isAlreadySelected = currentEl.classList.contains('selected');
                const currentShortLabel = currentEl.getAttribute('data-short-label');

                if (isAlreadySelected) {
                    deselectRange(index);
                } else {
                    if (currentShortLabelGlobal === null || currentShortLabelGlobal !== currentShortLabel) {
                        clearSelection();
                        currentShortLabelGlobal = currentShortLabel;
                    }

                    if (startIndex === null) {
                        startIndex = index;
                        endIndex = index;
                    } else {
                        if (index < startIndex) {
                            startIndex = index;
                        } else {
                            endIndex = index;
                        }
                    }
                    selectRange(startIndex, endIndex, currentShortLabelGlobal);
                }

                updateButtonContainer();
            }

            function selectRange(start, end, currentShortLabel) {
                textElements.forEach((el, i) => {
                    if (el.getAttribute('data-short-label') === currentShortLabel &&
                        ((i >= start && i <= end) || (i <= start && i >= end))) {
                        el.classList.add('selected');
                    } else {
                        el.classList.remove('selected');
                    }
                });
            }

            function deselectRange(index) {
                if (index === startIndex) {
                    clearSelection();
                } else {
                    if (index < startIndex) {
                        selectRange(index + 1, startIndex - 1, currentShortLabelGlobal);
                        startIndex = index + 1;
                    } else if (index > startIndex && index <= endIndex) {
                        selectRange(startIndex, index - 1, currentShortLabelGlobal);
                        endIndex = index - 1;
                    }
                }
            }

            function clearSelection() {
                textElements.forEach(el => el.classList.remove('selected'));
                startIndex = null;
                endIndex = null;
                currentShortLabelGlobal = null;
                updateButtonContainer();
            }

            function updateButtonContainer() {
                const selectedTexts = document.querySelectorAll('.selected');
                if (selectedTexts.length > 0) {
                    buttonContainer.style.display = 'block';
                } else {
                    buttonContainer.style.display = 'none';
                }
            }

            document.getElementById('copy-button').addEventListener('click', function() {
                const selectedElements = Array.from(document.querySelectorAll('.selected'));
                if (selectedElements.length === 0) return;

                const selectedTexts = selectedElements.map((el, index) => {
                    const paragraph = el.querySelector('.number').textContent;
                    const sentence = el.querySelector('.text').textContent.trim();
                    return `${(selectedElements.length > 1 || index > 0) ? paragraph + ' ' : ''}${sentence}`;
                }).join('\n');

                const paragraphs = selectedElements.map(el => parseInt(el.querySelector('.number').textContent));
                
                let referenceElement = selectedElements[0].closest('.reference');
                if (!referenceElement) {
                    let currentElement = selectedElements[0];
                    while (currentElement.previousElementSibling) {
                        currentElement = currentElement.previousElementSibling;
                        if (currentElement.classList.contains('reference')) {
                            referenceElement = currentElement;
                            break;
                        }
                    }
                }
                
                if (!referenceElement) {
                    console.error('참조 요소를 찾을 수 없습니다.');
                    return;
                }

                const copyRef = referenceElement.getAttribute('data-copy-ref');
                
                let reference = '';
                if (paragraphs.length > 1) {
                    const startParagraph = Math.min(...paragraphs);
                    const endParagraph = Math.max(...paragraphs);
                    reference = `${copyRef.slice(0, -1)}:${startParagraph}-${endParagraph}]`;
                } else {
                    const singleParagraph = paragraphs[0];
                    reference = `${copyRef.slice(0, -1)}:${singleParagraph}]`;
                }

                const result = `${reference}\n${selectedTexts}`;
                navigator.clipboard.writeText(result).then(() => {
                    selectedElements.forEach(el => {
                        el.classList.add('blink');
                    });
                    setTimeout(() => {
                        selectedElements.forEach(el => {
                            el.classList.remove('blink', 'selected');
                            el.classList.add('fade-in');
                        });
                        setTimeout(() => {
                            selectedElements.forEach(el => el.classList.remove('fade-in'));
                            updateButtonContainer();
                            clearSelection(); // 복사 후 선택 해제
                        }, 1000);  // 1초 후에 텍스트만 나타나도록 배경 제거
                    });
                });
            });

            document.getElementById('clear-button').addEventListener('click', function() {
                clearSelection();
            });
        })
        .catch(error => console.error('Error fetching data:', error));
});
