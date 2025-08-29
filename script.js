
        // DOM elements
        const fileInput = document.getElementById('file-input');
        const fileCount = document.getElementById('file-count');
        const qualitySlider = document.getElementById('quality-slider');
        const qualityValue = document.getElementById('quality-value');
        const formatSelect = document.getElementById('format-select');
        const resizeCheckbox = document.getElementById('resize-checkbox');
        const resizeOptions = document.getElementById('resize-options');
        const maxWidth = document.getElementById('max-width');
        const maxHeight = document.getElementById('max-height');
        const compressBtn = document.getElementById('compress-btn');
        const downloadBtn = document.getElementById('download-btn');
        const resetBtn = document.getElementById('reset-btn');
        const originalPreview = document.getElementById('original-preview');
        const compressedPreview = document.getElementById('compressed-preview');
        const originalFormat = document.getElementById('original-format');
        const originalSize = document.getElementById('original-size');
        const compressedFormat = document.getElementById('compressed-format');
        const compressedSize = document.getElementById('compressed-size');
        const statusText = document.getElementById('status-text');
        const dropZone = document.getElementById('drop-zone');
        const progressBar = document.getElementById('progress-bar');
        const progressContainer = document.querySelector('.progress-bar');
        
        // State variables
        let originalImage = null;
        let originalImageFile = null;
        let compressedImageData = null;
        
        // Event listeners
        fileInput.addEventListener('change', handleFileSelect);
        qualitySlider.addEventListener('input', updateQualityValue);
        resizeCheckbox.addEventListener('change', toggleResizeOptions);
        compressBtn.addEventListener('click', compressImage);
        downloadBtn.addEventListener('click', downloadImage);
        resetBtn.addEventListener('click', resetAll);
        
        // Drag and drop functionality
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('drag-over');
        });
        
        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('drag-over');
        });
        
        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('drag-over');
            
            if (e.dataTransfer.files.length > 0) {
                fileInput.files = e.dataTransfer.files;
                handleFileSelect({ target: fileInput });
            }
        });
        
        // Click on drop zone to open file dialog
        dropZone.addEventListener('click', (e) => {
            if (e.target === dropZone || !e.target.closest('label')) {
                fileInput.click();
            }
        });
        
        // Functions
        function updateQualityValue() {
            qualityValue.textContent = `${qualitySlider.value}%`;
        }
        
        function toggleResizeOptions() {
            resizeOptions.style.display = resizeCheckbox.checked ? 'block' : 'none';
        }
        
        function handleFileSelect(event) {
            const file = event.target.files[0];
            
            if (!file) return;
            
            // Check if file is an image
            if (!file.type.match('image.*')) {
                statusText.textContent = 'Please select a valid image file (JPG, PNG, GIF, WebP).';
                return;
            }
            
            // Update selected file text
            fileCount.textContent = file.name;
            
            // Show progress bar
            progressContainer.style.display = 'block';
            progressBar.style.width = '10%';
            
            const reader = new FileReader();
            
            reader.onload = function(e) {
                originalImageFile = file;
                
                // Create image to get dimensions
                const img = new Image();
                img.onload = function() {
                    progressBar.style.width = '50%';
                    
                    // Display original image
                    originalPreview.innerHTML = '';
                    const origImg = document.createElement('img');
                    origImg.src = e.target.result;
                    originalPreview.appendChild(origImg);
                    
                    // Update original file info
                    const fileSize = formatFileSize(file.size);
                    originalFormat.textContent = file.type.split('/')[1].toUpperCase();
                    originalSize.textContent = fileSize;
                    
                    // Store original image
                    originalImage = img;
                    
                    progressBar.style.width = '100%';
                    
                    setTimeout(() => {
                        progressContainer.style.display = 'none';
                        compressBtn.disabled = false;
                        statusText.textContent = 'Image loaded. Adjust settings and click "Compress Image".';
                    }, 500);
                };
                img.src = e.target.result;
            };
            
            reader.readAsDataURL(file);
        }
        
        function compressImage() {
            if (!originalImage) {
                statusText.textContent = 'Please select an image first.';
                return;
            }
            
            statusText.textContent = 'Compressing image...';
            compressBtn.disabled = true;
            progressContainer.style.display = 'block';
            progressBar.style.width = '30%';
            
            // Get compression settings
            const quality = parseInt(qualitySlider.value) / 100;
            const outputFormat = formatSelect.value === 'original' 
                ? originalImageFile.type.split('/')[1] 
                : formatSelect.value;
                
            // Check if we need to resize
            let targetWidth = originalImage.width;
            let targetHeight = originalImage.height;
            
            if (resizeCheckbox.checked) {
                const maxW = parseInt(maxWidth.value);
                const maxH = parseInt(maxHeight.value);
                
                if (originalImage.width > maxW || originalImage.height > maxH) {
                    const ratio = Math.min(maxW / originalImage.width, maxH / originalImage.height);
                    targetWidth = Math.round(originalImage.width * ratio);
                    targetHeight = Math.round(originalImage.height * ratio);
                }
            }
            
            // Create canvas for compression
            const canvas = document.createElement('canvas');
            canvas.width = targetWidth;
            canvas.height = targetHeight;
            const ctx = canvas.getContext('2d');
            
            // Draw image to canvas
            ctx.drawImage(originalImage, 0, 0, targetWidth, targetHeight);
            
            progressBar.style.width = '70%';
            
            // Convert to compressed format
            setTimeout(() => {
                let mimeType;
                switch(outputFormat) {
                    case 'jpeg':
                        mimeType = 'image/jpeg';
                        break;
                    case 'png':
                        mimeType = 'image/png';
                        break;
                    case 'webp':
                        mimeType = 'image/webp';
                        break;
                    case 'gif':
                        mimeType = 'image/gif';
                        break;
                    default:
                        mimeType = 'image/jpeg';
                }
                
                // Get compressed data URL
                const dataURL = canvas.toDataURL(mimeType, quality);
                
                progressBar.style.width = '90%';
                
                // Display compressed image
                compressedPreview.innerHTML = '';
                const compImg = document.createElement('img');
                compImg.src = dataURL;
                compressedPreview.appendChild(compImg);
                
                // Calculate compressed size
                const compressedBytes = getDataURLSize(dataURL);
                const compressedSizeFormatted = formatFileSize(compressedBytes);
                
                // Update compressed file info
                compressedFormat.textContent = outputFormat.toUpperCase();
                compressedSize.textContent = compressedSizeFormatted;
                
                // Calculate savings
                const savings = originalImageFile.size - compressedBytes;
                const percent = (savings / originalImageFile.size * 100).toFixed(1);
                
                // Store compressed data
                compressedImageData = dataURL;
                
                progressBar.style.width = '100%';
                
                setTimeout(() => {
                    progressContainer.style.display = 'none';
                    compressBtn.disabled = false;
                    downloadBtn.disabled = false;
                    
                    if (savings > 0) {
                        statusText.textContent = `Compression complete! Saved ${formatFileSize(savings)} (${percent}%)`;
                    } else {
                        statusText.textContent = 'Compression complete! (No size reduction)';
                    }
                }, 500);
                
            }, 300);
        }
        
        function downloadImage() {
            if (!compressedImageData) {
                statusText.textContent = 'Please compress an image first.';
                return;
            }
            
            // Create download link
            const downloadLink = document.createElement('a');
            const outputFormat = formatSelect.value === 'original' 
                ? originalImageFile.type.split('/')[1] 
                : formatSelect.value;
                
            downloadLink.href = compressedImageData;
            downloadLink.download = `compressed-image.${outputFormat}`;
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
            
            statusText.textContent = 'Download started!';
        }
        
        function resetAll() {
            // Reset everything
            fileInput.value = '';
            originalImage = null;
            originalImageFile = null;
            compressedImageData = null;
            fileCount.textContent = 'No files selected';
            statusText.textContent = 'Ready to compress. Select an image to begin.';
            compressBtn.disabled = true;
            downloadBtn.disabled = true;
            progressContainer.style.display = 'none';
            
            // Reset previews
            originalPreview.innerHTML = `
                <div class="empty-state" style="padding: 20px;">
                    <div class="empty-icon">📷</div>
                    <p class="empty-text">No image</p>
                </div>
            `;
            
            compressedPreview.innerHTML = `
                <div class="empty-state" style="padding: 20px;">
                    <div class="empty-icon">⚡</div>
                    <p class="empty-text">Compressed version</p>
                </div>
            `;
            
            // Reset file info
            originalFormat.textContent = '-';
            originalSize.textContent = '-';
            compressedFormat.textContent = '-';
            compressedSize.textContent = '-';
            
            // Reset controls
            qualitySlider.value = 80;
            qualityValue.textContent = '80%';
            formatSelect.value = 'original';
            resizeCheckbox.checked = false;
            resizeOptions.style.display = 'none';
            maxWidth.value = 1200;
            maxHeight.value = 1200;
        }
        
        // Helper functions
        function formatFileSize(bytes) {
            if (bytes < 1024) {
                return bytes + ' bytes';
            } else if (bytes < 1048576) {
                return (bytes / 1024).toFixed(1) + ' KB';
            } else {
                return (bytes / 1048576).toFixed(1) + ' MB';
            }
        }
        
        function getDataURLSize(dataURL) {
            // Remove metadata from data URL to get approximate size
            const base64 = dataURL.split(',')[1];
            const approximateSize = Math.round((base64.length * 3) / 4);
            return approximateSize;
        }
        
        // Initialize
        updateQualityValue();
        toggleResizeOptions();
