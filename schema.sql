-- Schema for DLS Data
CREATE TABLE IF NOT EXISTS dls_data_v2 (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    text TEXT NOT NULL,                    -- The main content
    title TEXT NOT NULL,                   -- Title of the content
    feature TEXT NOT NULL,                 -- DLS feature: 'general', 'gkm', 'regional_services', 'cmb', 'compliance'
    category TEXT NOT NULL,                -- Category: 'overview', 'technical', 'compliance', 'configuration', 'troubleshooting', 'legal'
    content_type TEXT NOT NULL,            -- Type: 'overview', 'technical', 'compliance', 'configuration', 'troubleshooting', 'legal', 'faq'
    source TEXT NOT NULL,                  -- Source of the content
    priority INTEGER NOT NULL DEFAULT 1,    -- Priority level (1-3, where 3 is highest)
    keywords TEXT NOT NULL,                -- Comma-separated keywords
    compliance_relevant BOOLEAN DEFAULT 0,  -- Indicates if content is particularly relevant for compliance
    regions TEXT,                          -- Specific regions this content applies to
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create index for better search performance
CREATE INDEX IF NOT EXISTS idx_dls_data_v2_feature ON dls_data_v2(feature);
CREATE INDEX IF NOT EXISTS idx_dls_data_v2_content_type ON dls_data_v2(content_type);
CREATE INDEX IF NOT EXISTS idx_dls_data_v2_priority ON dls_data_v2(priority);

-- Insert DLS Overview
INSERT INTO dls_data_v2 (
    text,
    title,
    feature,
    category,
    content_type,
    source,
    priority,
    keywords
) VALUES (
    'The Data Localization Suite (DLS) is a set of 3 features which are compatible and complementary to each other: 1. Geo Key Manager (GKM): restrict where the private TLS keys used for TLS Certificates are stored and managed. 2. Regional Services: control over where your traffic is decrypted and inspected. 3. Customer Metadata Boundary (CMB): control over how metadata about your traffic is handled and stored. The Data Localization Suite (DLS) is currently only available for Enterprise customers.',
    'DLS Overview',
    'general',
    'overview',
    'overview',
    'DLS Documentation',
    3,
    'DLS,features,enterprise,overview,GKM,Regional Services,CMB'
);

-- Insert CMB Configuration
INSERT INTO dls_data_v2 (
    text,
    title,
    feature,
    category,
    content_type,
    source,
    priority,
    keywords
) VALUES (
    'Customer Metadata Boundary (CMB) is entitled on the Account-Level. It''s an Account-Level Entitlement. Afterwards, the customer can configure Customer Metadata Boundary in their Account Configurations, in order to set the storing of their Customer Logs (metadata) to be only in the US or only in the EU, or both (global, which is the default).',
    'CMB Configuration',
    'cmb',
    'configuration',
    'technical',
    'DLS Documentation',
    2,
    'CMB,configuration,account,entitlement,logs,US,EU,global'
);

-- Insert CMB Technical Details
INSERT INTO dls_data_v2 (
    text,
    title,
    feature,
    category,
    content_type,
    source,
    priority,
    keywords
) VALUES (
    'As part of the Data Localization Suite (DLS), the Customer Metadata Boundary (CMB) ensures that any traffic metadata which identifies a customer''s end user (that is, contains the customer''s Account ID) will stay in the European Union (EU) or in the United States of America (USA), depending on the region the customer selects. The only options for CMB today are either EU only, USA only, or Global (meaning both EU and USA, which is the default value). For example, if a customer selects the EU Customer Metadata Boundary, Customer Logs (metadata) will only be sent to Cloudflare''s core data center located in the European Union (EU).',
    'CMB Details',
    'cmb',
    'technical',
    'technical',
    'DLS Documentation',
    2,
    'CMB,EU,USA,global,metadata,logs,traffic,customer data'
);

-- Insert GKM Overview
INSERT INTO dls_data_v2 (
    text,
    title,
    feature,
    category,
    content_type,
    source,
    priority,
    keywords
) VALUES (
    'By default, private keys will be encrypted and securely distributed to each data center worldwide, where they can be utilized for Edge SSL/TLS termination and processing. As part of the Data Localization Suite (DLS), Geo Key Manager (GKM) allows customers to choose where to store their private TLS keys. Geo Key Manager can restrict the upload of private Key material to the USA, EU, and high-security data centers. There''s a new version of Geo Key Manager, available in Closed Beta, which allows customers to create allowlists and blocklists of specific countries in which customer private keys will be stored. That means that customers will be able to create specifications, for example store customer private keys only in Australia or store their private keys in the EU and in the UK.',
    'GKM Overview',
    'gkm',
    'overview',
    'overview',
    'DLS Documentation',
    2,
    'GKM,TLS,SSL,private keys,encryption,data centers,EU,USA,Australia,UK'
);

-- Insert Key Management Solutions
INSERT INTO dls_data_v2 (
    text,
    title,
    feature,
    category,
    content_type,
    source,
    priority,
    keywords
) VALUES (
    'Cloudflare offers two Key Management solutions: Keyless SSL and Geo Key Manager (GKM). Both solutions ensure that private SSL/TLS key material stays in the customer''s intended region. The standard Cloudflare TLS service requires a customer to share the TLS key for their website. However, for some customers there are policy or technical obstacles preventing them from sharing the TLS key for their website. Keyless SSL allows customers to use Cloudflare''s TLS service while retaining on-premise custody of your private keys. Keyless SSL ensures that Cloudflare never has possession of the private TLS key at all, while Geo Key Manager uses Cloudflare-managed Keyless SSL to ensure the TLS private keys never leave the specified region.',
    'Key Management Solutions',
    'gkm',
    'technical',
    'technical',
    'DLS Documentation',
    2,
    'GKM,Keyless SSL,TLS,SSL,private keys,key management'
);

-- Insert Regional Services Overview
INSERT INTO dls_data_v2 (
    text,
    title,
    feature,
    category,
    content_type,
    source,
    priority,
    keywords
) VALUES (
    'Regional Services gives you the ability to accommodate regional restrictions by choosing which subset of data centers decrypt and service HTTPS traffic. With Regional Services, TLS is only terminated inside the configured region. For example, if a hostname is configured to regionalize to the EU, any HTTPS request from the US will route to the EU.',
    'Regional Services Overview',
    'regional_services',
    'overview',
    'overview',
    'DLS Documentation',
    2,
    'Regional Services,TLS,HTTPS,traffic,regions,EU,US'
);

-- Insert Regional Services Availability
INSERT INTO dls_data_v2 (
    text,
    title,
    feature,
    category,
    content_type,
    source,
    priority,
    keywords
) VALUES (
    'The Regions available for Regional Services are the following: Australia, Canada, European Union (EU), India, Japan, United States of America (USA), FedRAMP Compliant, ISO 27001 Certified European Union, Germany, Singapore. Cloudflare will only use data centers or points of presence (PoPs) that are physically located within the selected Region to decrypt and service HTTPS traffic.',
    'Regional Services Availability',
    'regional_services',
    'technical',
    'technical',
    'DLS Documentation',
    2,
    'Regional Services,regions,data centers,PoPs,Australia,Canada,EU,India,Japan,USA,Germany,Singapore,FedRAMP,ISO 27001'
);

-- Insert Regional Services Configuration
INSERT INTO dls_data_v2 (
    text,
    title,
    feature,
    category,
    content_type,
    source,
    priority,
    keywords
) VALUES (
    'You can use Regional Services through the dashboard or via API. The easiest way to configure Regional Services is through the Dashboard on the DNS Tab by creating a new DNS Record and selecting a Region in the dropdown. Additionally, you can also configure Regional Services using Terraform. For more details, refer to the cloudflare_regional_hostname resource in the Terraform documentation.',
    'Regional Services Configuration',
    'regional_services',
    'configuration',
    'technical',
    'DLS Documentation',
    2,
    'Regional Services,configuration,dashboard,API,DNS,Terraform'
);

-- Insert GDPR Compliance Overview
INSERT INTO dls_data_v2 (
    text,
    title,
    feature,
    category,
    content_type,
    source,
    priority,
    keywords,
    compliance_relevant,
    regions
) VALUES (
    'Cloudflare believes that EU customers can use Cloudflare''s services in a manner consistent with GDPR and the Schrems II decision, as Cloudflare''s customer Data Processing Addendum (DPA) incorporates the new EU Standard Contractual Clauses (SCC) and also incorporates additional safeguards as outlined in the EDPB''s June 2021 Recommendations on Supplementary Measures. Some of these additional safeguards are contractual, but many are technical measures that apply across the board on the Cloudflare Service. Some of these technical measures include ensuring that all of Cloudflare''s Edge points of presence (PoPs) and Core data centers meet industry security standards such as the Payment Card Industry Data Security Standard (PCI-DSS), ensuring that secure boot is implemented at Cloudflare''s PoPs and data center, and implementing a number of logical security safeguards in the form of access management rules, configuration management, access logging and monitoring, and vulnerability management. Nevertheless, Cloudflare recognizes that many of Cloudflare''s customers view their legal obligations as requiring EU personal data to stay in the EU region. For that reason, Cloudflare developed an optional suite of services to address those requirements, called the Data Localization Suite (DLS).',
    'GDPR Compliance and DLS',
    'compliance',
    'legal',
    'compliance',
    'DLS Documentation',
    3,
    'GDPR,Schrems II,DPA,SCC,EDPB,compliance,EU,PCI-DSS,security,data protection',
    1,
    'EU'
);

-- Insert DLS Technical Compliance
INSERT INTO dls_data_v2 (
    text,
    title,
    feature,
    category,
    content_type,
    source,
    priority,
    keywords,
    compliance_relevant,
    regions
) VALUES (
    'The Data Localization Suite (DLS) provides technical controls that help customers maintain compliance with data localization requirements. GKM ensures cryptographic keys remain in designated regions, Regional Services ensures traffic inspection occurs only in specified locations, and CMB controls where metadata is stored. These features work together to provide comprehensive data residency controls. All DLS components are designed to meet strict compliance requirements and are regularly audited against security standards including ISO 27001, SOC 2, and PCI DSS.',
    'DLS Compliance Framework',
    'compliance',
    'technical',
    'compliance',
    'DLS Documentation',
    3,
    'compliance,technical controls,data residency,ISO 27001,SOC 2,PCI DSS,security,audit',
    1,
    'global'
);

-- Update DLS Overview with enhanced compliance context
UPDATE dls_data_v2
SET text = 'The Data Localization Suite (DLS) is a comprehensive set of 3 features designed to help Enterprise customers meet data localization requirements. The features work together seamlessly: 1. Geo Key Manager (GKM): controls where private TLS keys are stored and managed, ensuring cryptographic material stays in designated regions. 2. Regional Services: provides granular control over where HTTPS traffic is decrypted and inspected, ensuring data processing occurs in compliant locations. 3. Customer Metadata Boundary (CMB): enables precise control over traffic metadata storage location. DLS is specifically designed for Enterprise customers who need to meet strict data residency requirements.',
    title = 'DLS Overview and Compliance',
    keywords = 'DLS,features,enterprise,overview,GKM,Regional Services,CMB,compliance,data residency,data localization',
    compliance_relevant = 1,
    regions = 'global'
WHERE title = 'DLS Overview' AND feature = 'general';

-- Insert CMB Compliance Details
INSERT INTO dls_data_v2 (
    text,
    title,
    feature,
    category,
    content_type,
    source,
    priority,
    keywords,
    compliance_relevant,
    regions
) VALUES (
    'Customer Metadata Boundary (CMB) is a critical component for data residency compliance. When configured for EU-only storage, all customer metadata, including logs containing Account IDs or end-user identifiable information, is strictly maintained within EU data centers. This helps organizations comply with EU data protection requirements and the Schrems II decision by ensuring that customer metadata remains within the EU jurisdiction. The EU-only setting is particularly relevant for organizations subject to strict interpretations of GDPR and other EU data protection regulations.',
    'CMB Compliance Impact',
    'cmb',
    'compliance',
    'compliance',
    'DLS Documentation',
    3,
    'CMB,EU,compliance,GDPR,Schrems II,data residency,metadata,privacy',
    1,
    'EU'
);

-- Insert Regional Services Compliance
INSERT INTO dls_data_v2 (
    text,
    title,
    feature,
    category,
    content_type,
    source,
    priority,
    keywords,
    compliance_relevant,
    regions
) VALUES (
    'Regional Services is designed to meet stringent data localization requirements by ensuring HTTPS traffic is only decrypted and processed within specified geographical boundaries. For organizations operating in regulated industries or regions with strict data sovereignty laws, Regional Services can be configured to use only data centers that meet specific compliance certifications, such as ISO 27001 Certified EU facilities or FedRAMP-compliant US locations. This granular control over traffic processing locations helps organizations maintain compliance with regional data protection regulations while leveraging Cloudflare''s global network.',
    'Regional Services Compliance Features',
    'regional_services',
    'compliance',
    'compliance',
    'DLS Documentation',
    3,
    'Regional Services,compliance,data sovereignty,ISO 27001,FedRAMP,traffic processing,data protection',
    1,
    'EU,USA,global'
);
