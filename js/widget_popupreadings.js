/* 
    
----------------------------------------------------------------------------
Version 1.0

Bearbeiten von Readings zu einem beliebigen Device. Dabei kann eine Auswahlliste, oder 
Freitext als Readingswert gesetzt werden. Des Weiteren kann über das Widget dem Device das
Attribut disabled mit dem Wert 0 oder 1 gesetzt werden.

(c) Sascha Hermann 2016

Verwendet:
JQuery: https://jquery.com/  [in fhem enthalten]
JQuery-UI: https://jqueryui.com/  [in fhem enthalten]
Switchery: https://github.com/abpetkov/switchery   [in fhem-tablet-ui enthalten]
----------------------------------------------------------------------------

ATTRIBUTE:
~~~~~~~~~~
    Attribute (Pflicht):
    ---------------
    data-type="popupreadings" : Widget-Typ
    data-device : FHEM Device Name
	data-readinglist='{"readingTitel":"<Anzeigetext>", "readingName":"<FHEM Reading aus dem Device>", "readingWerte":"<Wert1>,<Wert2>", "readingReadOnly":"true"}, {<Beliebige erweiterbar>}' : Liste der angezeigten Readings.

    Attribute (Optional):
    -----------------    
    data-width: Breite des Dialogs (Standard '450').
    data-height: Höhe des Dialogs (Standard '300').
    data-title: Titel des Dialogs. Angabe ALIAS verwendet den Alias des Device.
                                               Angabe NAME verwendet den Namen des Device.
                                               Angabe eines beliebigen Dialog-Titels (Standard 'NAME').
    data-icon: Dialog Titel Icon (Standard 'fa-clock-o').
    data-disablestate: deaktiviert die Möglichkeit das Device zu deaktivieren/aktivieren
    data-theme: Angabe des Themes, mögich ist 'dark', 'light', oder beliebige eigene CSS-Klasse für individuelle Themes.
    data-style: Angabe 'round' oder 'square'.
    data-infotext: Zeigt über den Readings einen beliebigen (Erklärungs-) Text an
    
localStore:
~~~~~~~~~    
    
Name: popupreadings_<FHEM_Device_Name>
 ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 [0] (Konfiguration)
	[0] (Device-Name)
	[1] (Disable-Status) (true=Enabled aktiv, false=Disabled deaktivert)
	[2] (Disable Status-Change) (true = Funktion gesperrt, false = Funktion freigegeben)
	[3] (Dialogs Titel)
	[4] (Theme-Class)
	[5] (Style)
    [6] (Dialog Informationstext)
 [1] (Readings-Liste)
	[0..n] (Reading)
		[0] (FHEM Reading)
		[1] (Anzeigetext)
		[2] (Aktueller Wert)
		[3] (Werteliste)
			[0..n] (Werte) (Ein Wert = Eingabefeld, Mehrere Werte = DropDown)
        [4] (Readonly)
*/

if(typeof widget_widget == 'undefined') {
    loadplugin('widget_widget');
}
if (!$.fn.Switchery){
    dynamicload('lib/switchery.min.js', null, null, false);
    $('head').append('<link rel="stylesheet" href="'+ dir + '/../lib/switchery.min.css" type="text/css" />');
}
if (!$.fn.draggable) {
    dynamicload('../pgm2/jquery-ui.min.js', null, null, false);
}

var widget_popupreadings = $.extend({}, widget_widget, {
    widgetname:"popupreadings",      
    popupreadings_showDialog: function(elem,device) { //Erstellen des Dialogs und öffnen des Dialogs
        var base = this;
        var config = new Array();
        
        config = widget_popupreadings.popupreadings_loadLocal(device);          
        $('body').append(widget_popupreadings.popupreadings_buildpopup(config, device));      

        popupreadings_dialog = $( ".popupreadings_dialog" ).dialog({
            height: elem.data('height'),
            width: elem.data('width'),
            autoOpen: false,
            modal: true,
            resizable: false, 
            closeOnEscape: false,
            dialogClass: "popupreadings "+"popupreadings_"+device, 
            title: config[0][3],
            buttons: {
                "Speichern": function(){
                    var canClose = base.popupreadings_saveReadings( $('.popupreadings_'+device), device );
                    if (canClose == true) {
                        popupreadings_dialog.dialog( "close" );       
                        $(this).parent().remove();         
                        $('#popupreadings_'+device).remove();						
                    }
                },
                "Abbrechen": function() {
                    popupreadings_dialog.dialog( "close" );       
                    $(this).parent().remove();         
                    $('#popupreadings_'+device).remove();
                }
            },
            create: function (e, ui) {	
                var pane = $('.popupreadings_'+device).find(".ui-dialog-buttonpane")
                if (config[0][1] == true) { var popupreadings_status = "checked"; } else { var popupreadings_status = ""; } 
                $("<div class='popupreadings_active ' ><input style='visibility: visible;' type='checkbox' class='js-switch' "+popupreadings_status+"/></div>").prependTo(pane);                
                $('.popupreadings_'+device).find('.ui-dialog-titlebar-close').remove();                
            }, 
            open: function () {			
                $(this).parent().children(".ui-dialog-titlebar").prepend('<i class="popupreadings_header_icon fa oa '+elem.data('icon')+'"></i>');
                base.popupreadings_setStatusChangeAction($('.popupreadings_'+device),config[0][1]);
            },		
        });        
        // // Benötige Klassen ergänzen
        $( ".popupreadings" ).children('.ui-dialog-titlebar').addClass('popupreadings_header '+config[0][4]+" "+config[0][5]);            
        $( ".popupreadings" ).children('.ui-dialog-buttonpane').addClass('popupreadings_footer '+config[0][4]+" "+config[0][5]); 
        $( ".popupreadings" ).find('.ui-dialog-buttonset > .ui-button').addClass('popupreadings_button '+config[0][4]+" "+config[0][5]);
        // //-----------------------------------------------          
        // //Verwendete Plugins aktivieren
        base.popupreadings_setDisableStatusSwitch($('.js-switch'),config[0][2]); //Status Switch
        // //-----------------------------------------------                     
        // // Aktionen zuweisen      
        $('.popupreadings_'+device).on("change", ".popupreadings_active", function () {
            base.popupreadings_setStatusChangeAction($('.popupreadings_'+device),  $(this).children('input').prop('checked')); //Device aktivieren/deaktivieren
        });
        // //-----------------------------------------------             
         popupreadings_dialog.dialog( "open" );
         $( "body" ).find('.ui-widget-overlay').addClass('popupreadings_shader');     
    },
    popupreadings_buildvaluedropdown: function(cmds, selectedval, readonly, theme, style) {
        var result = ""; 
        if (readonly == "true") {var attr_readonly = "disabled"; } else { var attr_readonly = ""; }

        result += "<select class='popupreadings_dropdownvalues "+theme+" "+style+"' name='popupreadings_value' "+attr_readonly+">";
        for (var i = 0; i < cmds.length; i++) { 
            if (cmds[i] === selectedval) { result += "<option value='"+i+"' selected>"+cmds[i]+"</option>"; }
            else { result += "<option value='"+i+"'>"+cmds[i]+"</option>"; }
        }
        result += "</select>";        
        return result;        
    },     
    popupreadings_buildreading: function(reading, id, theme, style) {
        var result = "";  
		if (reading[3].length < 2 && reading[2].trim() == "") {var error = "error";} else {var error = "";}
        
        result += 	"<div id='reading"+id+"' class='popupreadings_reading row align-center "+error+"'>" +
					"   <div class='popupreadings_readingname cell inline text "+theme+"'>"+reading[1]+"</div>" + 
					"   <div class='popupreadings_readingvalue cell inline input-control text'>";
		if (reading[3].length > 1) {
			result += widget_popupreadings.popupreadings_buildvaluedropdown(reading[3], reading[2], reading[4],theme, style);
		} else {
            if (reading[4] == "true") {var attr_readonly = "readonly"; } else { var attr_readonly = ""; }                  
			result += 	"       <input class='popupreadings_readinginput "+theme+" "+style+"' type='text' style='visibility: visible;' value='"+reading[2]+"' "+attr_readonly+">";    
		}					
		result += 	"   </div>" +                  
					"</div>";                 
		return result;          
    },   
    popupreadings_buildpopup: function(config,device) {
        var result = "";   
                
        result += 	"<div id='popupreadings_"+device+"' class='popupreadings_dialog "+config[0][4]+"'>";
        if (config[0][6] != '') { result += "<div class='popupreadings_infotext "+config[0][4]+"'>"+config[0][6]+"</div>"; }       
        result += "   <div class='popupreadings_readingslist'>";  
        for (var i = 0; i < config[1].length; i++) {
            result += widget_popupreadings.popupreadings_buildreading(config[1][i],i,config[0][4],config[0][5]);
        }    			
        result += 	"   </div>"+
                    "</div>";
        return result;
    },           
    popupreadings_saveReadings: function(elem, device) {
        var arr_config = new Array();
        var cmd = "";
        var device_state = true;
        arr_config = widget_popupreadings.popupreadings_loadLocal(device);   
 
        device_state = elem.find('.js-switch').prop('checked');   
        if (device_state != arr_config[0][1]) {
            //Geänderten Status setzen            
            if (device_state == true) {cmd = "attr "+device+" disable 0";} 
			else { cmd = "attr "+device+" disable 1";}
			DEBUG &&  console.log("Status wird geändert '"+cmd+"'  ["+device+"]");

            setFhemStatus(cmd);
            if( device && typeof device != "undefined" && device !== " ") {
                TOAST && $.toast(cmd);
            }            
            //--------------------------------------------------
            //Aktuelle Einstellungen/Profile in localStore schreiben    
            arr_config[0][1] = device_state;
            widget_popupreadings.popupreadings_saveLocal(arr_config); 
            //--------------------------------------------------
        }  

        if (device_state == true) {
            var arr_currentReadingsResult = new Array();
            //Aktuelle Readings ermitteln und setzen
            arr_currentReadingsResult = widget_popupreadings.popupreadings_getCurrentReadings($('.popupreadings_'+device),arr_config[1]);
            if (arr_currentReadingsResult[0] == false) { //Readings enthalten keine Fehler               
                for (var i = 0; i < arr_currentReadingsResult[1].length; i++) {                
                    if( arr_currentReadingsResult[1][i][2] != arr_config[1][i][2]) { //Reading wurde geändert
                        arr_config[1][i][2] = arr_currentReadingsResult[1][i][2];
                        //Aktualisiertes define setzen     
                        cmd = "setreading "+device+" "+arr_config[1][i][0]+" "+arr_config[1][i][2];       
                        DEBUG && console.log("Reading wird geändert '"+cmd+"'  ["+device+"]");
                    
                        setFhemStatus(cmd.trim());
                        if( device && typeof device != "undefined" && device !== " ") {
                            TOAST && $.toast(cmd);
                        }                                                        
                    }
                }                        
            } else { //Mind. ein Profile enthält einen Fehler
                alert('Einstellungen konnten nicht übernommen werden');
                return false;
            }            
            //--------------------------------------------------
            //Aktuelle Einstellungen/Profile in localStore schreiben    
            widget_popupreadings.popupreadings_saveLocal(arr_config); 
            //--------------------------------------------------  
        }
        return true;
    },
    popupreadings_saveLocal: function(config) {
        var dataToStore = JSON.stringify(config);
        localStorage.setItem(this.widgetname+"_"+config[0][0], dataToStore);
    },    
    popupreadings_loadLocal: function(device) {        
        var dataFromStore = new Array();
        dataFromStore = JSON.parse(localStorage.getItem(this.widgetname+"_"+device));        
        return dataFromStore;
    },         
    popupreadings_setStatusChangeAction(elem,wdtimer_enabled){
            if (wdtimer_enabled == false) { 
                elem.children('.popupreadings_dialog').append('<div class="ui-widget-overlay ui-front popupreadings_shader popupreadings_readingslist" style="z-index: 5999; top: '+elem.children('.popupreadings_dialog').position().top+'px; height: '+elem.children('.popupreadings_dialog').height()+'px;      "></div>'); 
            }
            else { 
                elem.children('.popupreadings_dialog').children('.popupreadings_shader').remove(); 
            }
    },                  
    popupreadings_setDisableStatusSwitch: function(elem,disablestate) {
         var switchery = new Switchery(elem[0], {
            size: 'small',
            color : '#00b33c',
            secondaryColor: '#ff4d4d',
            className : 'switchery popupreadings_active_checkbox',
            disabled: disablestate,
         });   
    },    
    popupreadings_getCheckedString :function(val) {
        var result = "";
        if (val == true) {result = "checked";}        
        return result;
    },
    popupreadings_getReadings: function (elem) { /*Erstellt den localStore, verankert den Aufruf des PopUps*/
        var attr_device = elem.data('device');  
        var attr_readinglist = elem.data('readinglist');
        var attr_title = elem.data('title');
        var attr_disablestate = elem.data('disablestate');
        var attr_theme = elem.data('theme');
        var attr_style = elem.data('style');
        var attr_infotext = elem.data('infotext');
        
        var error = false;

        $.ajax({
            async: true,
            timeout: 15000,
            cache: false,
            context:{'DEF': 'DEF'},            
            url: $("meta[name='fhemweb_url']").attr("content") || "/fhem/",
            data: {
                cmd: ["list",attr_device].join(' '),
                XHR: "1"
            }            
        })
        .done(function(data ) {
            var arr_localStore = new Array(); // Array mit gesamter Konfiguration
            var arr_config = new Array(); //Sonstige Angaben des Device
            var device_enabled = true;
            if (attr_title == 'NAME') { var device_title = attr_device; } else { var device_title = attr_title; }            
            var arr_readingslist = new Array(); //Verfügbare Reading Werte (Dropdown oder Eingabefeld)
            var listresult = data.split(/\n/);
                              
            //Readingliste aus Attribut aufbauen            
            if (attr_readinglist != '') {
                for (var i=0;i<attr_readinglist.length;i++){
                    var arr_reading = new Array();
                    var arr_readingvalues = new Array();                  
                    
                    if (attr_readinglist[i].readingReadOnly != undefined) {var r_readOnly = attr_readinglist[i].readingReadOnly; } else {var r_readOnly = false;}
                    if (attr_readinglist[i].readingValues != undefined) {
                        arr_readingvalues = attr_readinglist[i].readingValues.split(',');                                                                            
                    } else {                            
                        arr_readingvalues.push("");                            
                    }       
                    arr_reading.push(attr_readinglist[i].readingName, attr_readinglist[i].readingTitel, "", arr_readingvalues, r_readOnly);  
                    arr_readingslist.push(arr_reading);
                }        
            } else {error = true;}           
            //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~                      
            //Aktueller Wert des Readings ermitteln              
            for (var i = 0; i < listresult.length; i++) {               
                for (var j=0;j<arr_readingslist.length;j++){           
                    if (listresult[i].indexOf(arr_readingslist[j][0]) > -1)   {
                        var r_listresult = listresult[i].split(" ");
                        var r_value = r_listresult[r_listresult.length-1];                    
                        arr_readingslist[j][2] = r_value;
                    }  
                }       
            }    
            //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~   
                        
            arr_config.push(attr_device); // zu Device
            arr_config.push(device_enabled); // Device Status (aktiv/disabled)
            arr_config.push(attr_disablestate); //Device aktivier-/deaktivierbar       
            arr_config.push(device_title); //Dialog Titel  
            arr_config.push(attr_theme); //verwendetes Theme
            arr_config.push(attr_style); //verwendeter Style       
            arr_config.push(attr_infotext); 
   
            arr_readingslist.sort(); //Gesamte Readingsliste  
            arr_localStore.push(arr_config,arr_readingslist); // Array mit gesamter Konfiguration            
            widget_popupreadings.popupreadings_saveLocal(arr_localStore); //Konfiguration speichern
            //-----------------------------------------------

            // Aufruf des Popups
            var showDialogObject = (elem.data('starter')) ? $(document).find( elem.data('starter') ) : elem.children(":first");
            showDialogObject.on( "click", function() {
                widget_popupreadings.popupreadings_showDialog(elem, attr_device);                        
            });    
            //-----------------------------------------------       
            if (error == false) { DEBUG && console.log("Widget vorbereitungen sind abgeschlossen. ["+attr_device+"]"); }
            else {console.log("FEHLER: Widget vorbereitungen nicht erfolgreich. ["+attr_device+"]"); }
        });	
    },      
    popupreadings_getCurrentReadings: function (elem, cmdlist) {
        var arr_readings = new Array(); //Verfügbare Readings
        var arr_currentReadingsResult = new Array(); //Enthält das Ergebnis
        var error = false;
        //arr_currentReadingsResult  (0) -> fehler ja/nein
        //                           (1) -> profilliste		
        elem.find('.popupreadings_reading').each(function(){
            var readingError = false;  
            var arr_reading = new Array();

            //Readingswert            
            var readingsval = $( this ).children( ".popupreadings_readingvalue" ).children("select[name='popupreadings_value']").find('option:selected').text();  //nicht val sondern der text
            if (readingsval == undefined || readingsval == "" ) { readingsval = $( this ).children( ".popupreadings_readingvalue" ).children("input").val(); }
            arr_reading.push("","",readingsval);
            //-----------------------------------------------                   
            //Prüfen der Profilangaben auf Gültigkeit                
            if (readingsval == undefined || readingsval == "" ) { readingError = true;} //Kein gültiger Befehl
            if (readingError == true) {
                    error = readingError;
                    $(this).addClass( "error" );
            } else { $(this).removeClass( "error" ); }
            //-----------------------------------------------                
            arr_readings.push(arr_reading);            
        });           
      
        if (arr_readings.length == 0) { error = true; } //Es muss mind. 1 Profil vorhanden sein.
        arr_currentReadingsResult.push(error, arr_readings);
        return arr_currentReadingsResult;        
    },
    init: function () {
        var base = this;
      
        this.elements = $('div[data-type="'+this.widgetname+'"]');
        this.elements.each(function(index) {            
            var elem=$(this);
            //Setzten der Standartattribute falls diese nicht angegeben wurden
            elem.data('readinglist',    $(this).data('readinglist') || '');     
            elem.data('width',    $(this).data('width') || '465');
            elem.data('height',    $(this).data('height') || '300');
            elem.data('title',  $(this).data('title') || 'NAME');
            elem.data('icon',  $(this).data('icon') || 'fa-clock-o');
            elem.data('disablestate',  $(this).data('disablestate') || false);
            elem.data('style',  $(this).data('style') || 'square'); //round or square           
            elem.data('theme',  $(this).data('theme') || 'light');  //light,dark,custom
            elem.data('infotext',  $(this).data('infotext') || '');
            //-----------------------------------------------            
            base.popupreadings_getReadings(elem); 
        });
    },            
    update: function (dev,par) {
    }
});


