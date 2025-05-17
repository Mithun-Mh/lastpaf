package com.skillsharing.dto;

import lombok.Data;

import javax.validation.constraints.NotBlank;

@Data
public class ResourceDTO {
    @NotBlank(message = "Resource title is required")
    private String title;

    @NotBlank(message = "URL is required")
    private String url;

    @NotBlank(message = "Type is required")
    private String type;
    
    // Add explicit getter/setter methods to ensure they're available
    public String getTitle() {
        return title;
    }
    
    public void setTitle(String title) {
        this.title = title;
    }
    
    public String getUrl() {
        return url;
    }
    
    public void setUrl(String url) {
        this.url = url;
    }
    
    public String getType() {
        return type;
    }
    
    public void setType(String type) {
        this.type = type;
    }
}