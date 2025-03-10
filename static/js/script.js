document.addEventListener('DOMContentLoaded', function() {
    const adForm = document.getElementById('adForm');
    const generateBtn = document.getElementById('generateBtn');
    const loadingDiv = document.getElementById('loading');
    const resultsDiv = document.getElementById('results');
    const headlinesDiv = document.getElementById('headlines');
    const descriptionsDiv = document.getElementById('descriptions');
    const copyBtn = document.getElementById('copyBtn');
    const errorMessage = document.getElementById('error-message');
    const extractedKeywordsCard = document.getElementById('extracted-keywords-card');
    const extractedKeywordsDiv = document.getElementById('extracted-keywords');
    const keywordsInput = document.getElementById('keywords');
    const objectiveSelect = document.getElementById('objective');
    
    // Add event listener for form submission
    adForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Show loading spinner and hide results
        loadingDiv.classList.remove('d-none');
        resultsDiv.classList.add('d-none');
        errorMessage.classList.add('d-none');
        extractedKeywordsCard.classList.add('d-none');
        
        // Disable generate button
        generateBtn.disabled = true;
        generateBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Generating...';
        
        // Get form data
        const formData = new FormData(adForm);
        
        // Send request to server
        fetch('/generate', {
            method: 'POST',
            body: formData
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.text().then(text => {
                try {
                    return JSON.parse(text);
                } catch (e) {
                    console.error('Error parsing JSON:', e);
                    console.log('Raw response:', text);
                    return { 
                        error: 'Invalid JSON response from server',
                        headlines: [],
                        descriptions: [],
                        extracted_keywords: []
                    };
                }
            });
        })
        .then(data => {
            // Hide loading spinner
            loadingDiv.classList.add('d-none');
            
            // Check for error
            if (data.error) {
                errorMessage.textContent = data.error;
                errorMessage.classList.remove('d-none');
                return;
            }
            
            // Clear previous results
            headlinesDiv.innerHTML = '';
            descriptionsDiv.innerHTML = '';
            extractedKeywordsDiv.innerHTML = '';
            
            // Display extracted keywords if available
            if (data.extracted_keywords && data.extracted_keywords.length > 0) {
                const keywordsHtml = data.extracted_keywords.map(keyword => 
                    `<span class="badge bg-info text-dark me-2 mb-2" data-keyword="${keyword}">${keyword}</span>`
                ).join('');
                
                extractedKeywordsDiv.innerHTML = keywordsHtml;
                extractedKeywordsCard.classList.remove('d-none');
                
                // Add click event listeners to keywords
                const keywordBadges = extractedKeywordsDiv.querySelectorAll('.badge');
                keywordBadges.forEach(badge => {
                    badge.addEventListener('click', function() {
                        const keyword = this.getAttribute('data-keyword');
                        addKeywordToInput(keyword);
                        
                        // Visual feedback
                        this.classList.remove('bg-info');
                        this.classList.add('bg-success');
                        this.classList.add('text-white');
                        
                        setTimeout(() => {
                            this.classList.remove('bg-success');
                            this.classList.remove('text-white');
                            this.classList.add('bg-info');
                        }, 1000);
                    });
                });
            }
            
            // Display headlines
            if (data.headlines && data.headlines.length > 0) {
                data.headlines.forEach(headline => {
                    const charCount = headline.length;
                    const charCountClass = charCount > 30 ? 'danger' : (charCount > 25 ? 'warning' : '');
                    
                    const item = document.createElement('div');
                    item.className = 'list-group-item d-flex justify-content-between align-items-center';
                    item.innerHTML = `
                        <span class="headline-text">${headline}</span>
                        <span class="char-count ${charCountClass}">${charCount}/30</span>
                        <span class="copy-item" title="Copy to clipboard">📋</span>
                    `;
                    
                    item.querySelector('.copy-item').addEventListener('click', function() {
                        copyToClipboard(headline);
                    });
                    
                    headlinesDiv.appendChild(item);
                });
            } else {
                headlinesDiv.innerHTML = '<div class="alert alert-warning">No headlines generated</div>';
            }
            
            // Display descriptions
            if (data.descriptions && data.descriptions.length > 0) {
                data.descriptions.forEach(description => {
                    const charCount = description.length;
                    const charCountClass = charCount > 90 ? 'danger' : (charCount > 80 ? 'warning' : '');
                    
                    const item = document.createElement('div');
                    item.className = 'list-group-item d-flex justify-content-between align-items-center';
                    item.innerHTML = `
                        <span class="description-text">${description}</span>
                        <span class="char-count ${charCountClass}">${charCount}/90</span>
                        <span class="copy-item" title="Copy to clipboard">📋</span>
                    `;
                    
                    item.querySelector('.copy-item').addEventListener('click', function() {
                        copyToClipboard(description);
                    });
                    
                    descriptionsDiv.appendChild(item);
                });
            } else {
                descriptionsDiv.innerHTML = '<div class="alert alert-warning">No descriptions generated</div>';
            }
            
            // Show results
            resultsDiv.classList.remove('d-none');
        })
        .catch(error => {
            console.error('Error:', error);
            loadingDiv.classList.add('d-none');
            errorMessage.textContent = 'An error occurred while generating ad content. Please try again.';
            errorMessage.classList.remove('d-none');
        })
        .finally(() => {
            // Re-enable generate button
            generateBtn.disabled = false;
            generateBtn.innerHTML = '<i class="bi bi-magic me-2"></i>Generate Ads';
        });
    });
    
    // Function to add a keyword to the keywords input
    function addKeywordToInput(keyword) {
        const currentKeywords = keywordsInput.value.split(',').map(k => k.trim()).filter(k => k);
        
        // Check if keyword already exists
        if (!currentKeywords.includes(keyword)) {
            // Add the new keyword
            currentKeywords.push(keyword);
            
            // Update the input value
            keywordsInput.value = currentKeywords.join(', ');
            
            // Show a tooltip or some visual feedback
            showTooltip(keywordsInput, `Added "${keyword}" to keywords!`);
        }
    }
    
    // Function to show a tooltip
    function showTooltip(element, message) {
        const tooltip = document.createElement('div');
        tooltip.className = 'keyword-tooltip';
        tooltip.textContent = message;
        
        // Position the tooltip
        const rect = element.getBoundingClientRect();
        tooltip.style.top = `${rect.bottom + window.scrollY + 5}px`;
        tooltip.style.left = `${rect.left + window.scrollX}px`;
        
        // Add to document
        document.body.appendChild(tooltip);
        
        // Remove after a delay
        setTimeout(() => {
            tooltip.classList.add('fade-out');
            setTimeout(() => {
                document.body.removeChild(tooltip);
            }, 300);
        }, 2000);
    }
    
    // Copy all content to clipboard
    copyBtn.addEventListener('click', function() {
        let content = '';
        
        // Get campaign details
        const brandName = document.getElementById('brand_name').value;
        const category = document.getElementById('category').value;
        const subcategory = document.getElementById('subcategory').value || 'N/A';
        const objectiveText = objectiveSelect.options[objectiveSelect.selectedIndex].text;
        
        // Add campaign details to content
        content += '=== CAMPAIGN DETAILS ===\n';
        content += `Brand: ${brandName}\n`;
        content += `Category: ${category}\n`;
        content += `Subcategory: ${subcategory}\n`;
        content += `Objective: ${objectiveText}\n\n`;
        
        // Add headlines
        content += '=== HEADLINES ===\n';
        const headlines = headlinesDiv.querySelectorAll('.headline-text');
        headlines.forEach((headline, index) => {
            content += `${index + 1}. ${headline.textContent.trim()}\n`;
        });
        
        // Add descriptions
        content += '\n=== DESCRIPTIONS ===\n';
        const descriptions = descriptionsDiv.querySelectorAll('.description-text');
        descriptions.forEach((description, index) => {
            content += `${index + 1}. ${description.textContent.trim()}\n`;
        });
        
        // Add extracted keywords if available
        if (!extractedKeywordsCard.classList.contains('d-none')) {
            content += '\n=== EXTRACTED KEYWORDS ===\n';
            const keywords = extractedKeywordsDiv.querySelectorAll('.badge');
            keywords.forEach((keyword, index) => {
                content += `${keyword.textContent.trim()}${index < keywords.length - 1 ? ', ' : ''}`;
            });
        }
        
        copyToClipboard(content);
    });
    
    // Function to copy text to clipboard
    function copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(() => {
            showCopiedMessage();
        }).catch(err => {
            console.error('Could not copy text: ', err);
        });
    }
    
    // Function to show copied message
    function showCopiedMessage() {
        let copiedMessage = document.querySelector('.copied-message');
        
        if (!copiedMessage) {
            copiedMessage = document.createElement('div');
            copiedMessage.className = 'copied-message';
            copiedMessage.textContent = 'Copied to clipboard!';
            document.body.appendChild(copiedMessage);
        }
        
        copiedMessage.style.display = 'block';
        
        setTimeout(() => {
            copiedMessage.style.display = 'none';
        }, 2000);
    }
}); 