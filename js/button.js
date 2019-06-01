// Standardized way of creating a div that acts as a button
// with accessibility baked in (aria roles, keyboard support w/out scroll, etc.)

// * The maybeLabel parameter can be a string (for aria-label) or a node (for aria-labelledby)
//   It is not required if the node contains text (which can be used as a label)
// * Allows disabled buttons to be focused (so they are perceiveable but not operable for all, equivalent experience)
// * Allows for toggle buttons (if the 'toggle' class has been added to the root node)
// * Allows for expander buttons (with indication of which node is connected)

// Note: the label on a toggle button shouldn't change
// Note: the label on an expand button can change between the different states - not explicitly supported here
// Note: an expander button does not also need to be a toggle button - the aria-expanded attribute is enough

// Handle autoparsing without passing parameters
// No 'maybeLabel' is needed if text content is added to the button, or an aria-label or aria-labelled attribute are used
// No 'maybeExpandNodeId' is needed if data-expand-node-id attribute is used (aria-controls might be used on other buttons)

// ? Can we just detect if aria-controls is set? Might there be situations where that is used but this is not an expander...
// data-expand-node-id

function Button(nodeId, maybeLabel, maybeExpandNodeId){
    
    var context = this;
    this.rootNode = document.getElementById(nodeId);
    this.toggleType = 0;
    this.onclickDetached;
     
    this.ariaSetup = function(){
        this.rootNode.setAttribute('role', 'button');
        this.rootNode.setAttribute('tabindex', '0');
        // Handle aria label / labelledby passed as parameter - can be set directly on the node
        if((this.rootNode.hasAttribute('aria-label') == false && this.rootNode.hasAttribute('aria-labelledby') == false) && maybeLabel){
            if(maybeLabel.nodeType && maybeLabel.nodeType == 1){
                this.rootNode.setAttribute('aria-labelledby', maybeLabel);
            }
            else{
                this.rootNode.setAttribute('aria-label', maybeLabel);
            }
        }
        else if(!this.rootNode.innerText){
            console.warn("Widget Library ARIA Button does not have any inner text content to act as a label; no aria-label or aria-labelledby attribute is present; and no label was given as an initialization parameter.", this.rootNode);
        }
        
        // Handle buttons that show an expanded area when clicked
        // Use attribute value for aria-controls if data-expand-node-id is present; parameter can also be used
        // NB - we can't assume that if a button has aria-controls on it, it is automatically an expand button
        // More robust to check that the node actually exists
        
        if(this.rootNode.hasAttribute('data-expand-node-id')){
            this.rootNode.setAttribute('aria-controls', this.rootNode.getAttribute('data-expand-node-id'));
            this.rootNode.setAttribute('aria-expanded', 'false');
        }
        else if(maybeExpandNodeId){
            this.rootNode.setAttribute('aria-controls', maybeExpandNodeId);
            this.rootNode.setAttribute('aria-expanded', 'false');
        }
        
        // Initialize as 'enabled'
        this.setDisabled(false);
        // For toggle buttons only - initialize as not pressed
        if(this.rootNode.classList.contains("toggle")){
            this.setPushed(false);
            if(this.rootNode.classList.contains("tristate")){
                this.toggleType = 3;
            }
            else{
                this.toggleType = 2;
            }
            // We are assuming that a tristate button cycles through the states:
            // false - mixed - true - false - mixed - true - etc
            this.rootNode.addEventListener("click", function(e){
                var p = e.currentTarget.getAttribute('aria-pressed');
                if(p == 'mixed' || (p == 'false' && context.toggleType == 2)){
                    context.setPushed(true);
                }
                else if(p == 'true'){
                    context.setPushed(false);
                }
                else if(p == 'false' && context.toggleType == 3){
                    context.setPushed('mixed');
                }
            });
        }
        // For 'expanding' buttons only - initialize as not expanded
        if(this.rootNode.hasAttribute('aria-expanded')){
            this.rootNode.addEventListener("click", function(e){
                var xpd = e.currentTarget.getAttribute('aria-expanded');
                if(xpd == 'true'){
                   context.setExpanded(false);
                }
                if(xpd == 'false'){
                    context.setExpanded(true);
                }     
            });
        }
        
    }
    
    // When a SPACE or ENTER keypress on the button is detected, target self with a click
    
    this.clickSelf = function(e){
        if(e.keyCode == 13 || e.keyCode == 32){
            e.preventDefault(); // stop page scrolling on button click
            e.target.click();
        }
    }
    
    // Remove or restore onclick handler, as well as setting disabled state
    
    this.setDisabled = function(on){
        if(on === undefined || on === true){
            this.rootNode.setAttribute('aria-disabled', 'true');
            this.onclickDetached = this.rootNode.getAttribute('onclick');
            this.rootNode.removeAttribute('onclick');
        }
        else if(on === false){
            this.rootNode.setAttribute('aria-disabled', 'false');
            if(this.onclickDetached){
                this.rootNode.setAttribute('onclick', this.onclickDetached);
            }
        }
    }
    
    // Toggle button functon
    
    this.setPushed = function(down){
        if(down === undefined || down === true){
            this.rootNode.setAttribute('aria-pressed', 'true');
        }
        else if(down === false){
            this.rootNode.setAttribute('aria-pressed', 'false');
        }
        // For 'truthy' values, set the button to be partially pressed (for tristate toggle)
        else if(down){
            this.rootNode.setAttribute('aria-pressed', 'mixed');
        }
    }
    
    // Expanded button function
    
    this.setExpanded = function(expanded){
        var expandee = document.getElementById(this.rootNode.getAttribute('aria-controls'));
        if(expanded === undefined || expanded === true){
            this.rootNode.setAttribute('aria-expanded', 'true');
            expandee.classList.add('expanded');
            // Signal on the root node that this area is expanded (allows page to be reconfigured)
            document.body.classList.add('expanded-' + this.rootNode.id);
        }
        else if(expanded === false){
            this.rootNode.setAttribute('aria-expanded', 'false');
            expandee.classList.remove('expanded');
            // Signal on the root node that this area is collapsed (allows page to be reconfigured)
            document.body.classList.remove('expanded-' + this.rootNode.id);
        }
    }
    
    // Note, keydown is used in the event listener because:
    // a) keyup doesn't let us capture space bar press to prevent document scroll
    // b) keypress doesn't capture the keycode for space in Firefox
    
    this.rootNode.addEventListener("keydown", function(e){context.clickSelf(e)});
    // This prevents click event handlers only, not onclick attributes
    this.rootNode.addEventListener("click", function(e){
        if(e.currentTarget.getAttribute('aria-disabled') == 'true'){
            e.stopImmediatePropagation();
        }
    });
    
    // Allow for disabling the widget indirectly
    
    this.rootNode.addEventListener("disable", function(e){
        e.stopImmediatePropagation();
        e.stopPropagation();
        this.setDisabled(true);
    }.bind(this));
    
    // Call this after the stopImmediatePropogation is set up, so the click handler for toggle buttons 
    // will not be called if the button is disabled
    
    this.ariaSetup();
    
}