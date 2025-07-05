import axios from "axios";
import fs from 'fs';
import os from 'os';
import path from 'path';
//constants

//get a refresh token
export async function getZohoRefreshToken(authCode) { 
    console.error(`[${new Date().toISOString()}] GetRefreshToken - trying now with ${authCode}`);
    console.error(`[${new Date().toISOString()}] GetRefreshToken - trying now in folder ${process.cwd()}`);
    return new Promise((resolve, reject) => {
        const url = `https://accounts.zoho.com/oauth/v2/token?code=${authCode}&redirect_uri=http://localhost:3000/authRedirect&client_id=${process.env.ZOHO_CLIENT_ID}&client_secret=${process.env.ZOHO_CLIENT_SECRET}&grant_type=authorization_code`;
        console.error('trying ' + url);
        axios({
            method: 'POST',
            url: url
        })
        .then(response => {
            if(response.data.error) {
                reject(response.data.error);
            }
            else {
                fs.writeFile('./data/refreshToken.txt', response.data.refresh_token, (err) => {
                if (err) throw err;
                    console.error(`[${new Date().toISOString()}] GetRefreshToken - token written successfully`);
                });
                resolve(response.data.refresh_token);
            }
        })
        .catch(err => reject(err));
    });
}

//get a Zoho auth token
export async function getZohoAccessToken() {
    return new Promise((resolve, reject) => {
        const filePath = path.join(process.cwd(), 'data', 'refreshToken.txt');
        
        fs.readFile(filePath, 'utf8', (err, refreshToken) => {
            if (err) {
                console.error('No file found: ', err);
                reject(err);
            }
            console.error('File content:', refreshToken);
            const accessTokenURL = `https://accounts.zoho.com/oauth/v2/token?refresh_token=${refreshToken}&client_id=${process.env.ZOHO_CLIENT_ID}&client_secret=${process.env.ZOHO_CLIENT_SECRET}&grant_type=refresh_token`;
            try{
            //console.error(accessTokenURL);
             axios.post(accessTokenURL, {headers: {'Content-Type' : 'application/json' }})
                .then(postResponse => {
                        //console.error(postResponse);
                        const accessToken = postResponse.data.access_token;
                        resolve(accessToken);
                })
                .catch((err) => {
                     reject('zoho token fail: ' + err);
                 });
            }
            catch(err){
                reject(err);
            }
        });
    });
}

export async function listZohoModules(accessToken) {
    const authHeaders = {'Content-Type' : 'application/json' , 'Authorization' : `Zoho-oauthtoken ${accessToken}`};
    const url = `https://www.zohoapis.com/crm/v8/settings/modules`;
    return new Promise((resolve, reject) => {
    axios({
        method: 'GET',
        url: url,
        headers: authHeaders
    })
    .then((response) => {
        const moduleData = response.data.modules;
        moduleData.forEach(mod => {
            delete mod.show_as_tab;
            delete mod.feeds_required;
            delete mod.business_card_field_limit;
            delete mod.access_type;
            delete mod.sub_menu_available;
            delete mod.actual_singular_label;
            delete mod.actual_plural_label;
            delete mod.profile_count;
            delete mod.arguments;
            delete mod.has_more_profile;
            delete mod.deletable;
            delete mod.web_link;
            delete mod.public_fields_configured;
            delete mod.sequence_number;
            delete mod.singular_label;
            delete mod.lookupable;
            delete mod.recycle_bin_on_delete;
            delete mod.visibility;
            delete mod.convertable;
            delete mod.api_supported;
            delete mod.quick_create;
            delete mod.presence_sub_menu;
            delete mod.has_more_profiles;
            mod.module_label = mod.plural_label;
            delete mod.plural_label;
            mod.module_type = mod.generated_type;
            delete mod.generated_type;
            //console.error(mod);
        });
        resolve(response.data.modules);
    })
    .catch(err => reject(err));
    });
}

export async function listZohoModuleFields(accessToken, moduleApiName) {
    const authHeaders = {'Content-Type' : 'application/json' , 'Authorization' : `Zoho-oauthtoken ${accessToken}`};
    const url = `https://www.zohoapis.com/crm/v8/settings/fields?module=${moduleApiName}`;
    return new Promise((resolve, reject) => {
    axios({
        method: 'GET',
        url: url,
        headers: authHeaders
    })
    .then((response) => {
        const fieldData = response.data.fields;
        fieldData.forEach(field => {
            delete field.webhook;
            delete field.colour_code_enabled_by_system;
            delete field.operation_type;
            delete field.customizable_properties;
            delete field.tooltip;
            delete field.display_format_properties;
            delete field.businesscard_supported;
            delete field.filterable;
            delete field.view_type;
            delete field.separator;
            delete field.history_tracking_enabled;
            delete field.external;
            delete field.enable_colour_code;
            delete field.crypt;
            delete field.created_source;
            delete field.display_type;
            delete field.ui_type;
            delete field.convert_mapping;
            delete field.pick_list_values_sorted_lexically;
            delete field.layout_associations;
            delete field.sortable;
            delete field.email_parser;
            delete field.json_type;
            delete field.unique;
            delete field.auto_number;
            delete field.display_format;
            delete field.profiles;
            delete field.association_details;
            delete field.modified_time;
            delete field.mass_update;
            delete field.searchable;
            delete field.type;
            delete field.virtual_field;
            delete field.history_tracking;
            delete field.quick_sequence_number;
            delete field.global_picklist;
            delete field.rollup_summary;
        });
        resolve(fieldData);
    })
    .catch(err => reject(err));
    });
}

export async function searchZohoRecords(accessToken, searchModule, searchString) {
    const authHeaders = {'Content-Type' : 'application/json' , 'Authorization' : `Zoho-oauthtoken ${accessToken}`};
    const url = `https://zohoapis.com/crm/v8/${searchModule}/search?word=${searchString}`;
    try {
        const response = await axios({
            method: 'GET',
            url: url,
            headers: authHeaders
        });
        //console.error(response.data);
        return response.data.data;
    } catch(err) {
        //console.error(err);
        return err;
    }
}

export async function getZohoRecordById(accessToken, moduleName, recordId) {
    const authHeaders = {'Content-Type' : 'application/json' , 'Authorization' : `Zoho-oauthtoken ${accessToken}`};
    const url = `https://www.zohoapis.com/crm/v8/${moduleName}/${recordId}`;
    try {
        const response = await axios({
            method: 'GET',
            url: url,
            headers: authHeaders
        });
        return response.data.data[0];
    } catch(err) {
        return err;
    }
}

function getLastPathSegment (urlString) {
  // Find the last occurrence of "/"
  const lastSlashIndex = urlString.lastIndexOf('/');

  // If no slash is found, return the original string
  if (lastSlashIndex === -1) {
    return urlString;
  }

  // Extract everything to the right of the last slash
  return urlString.substring(lastSlashIndex + 1);
}
