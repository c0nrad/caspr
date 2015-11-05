package main

import "encoding/json"

type Report struct {
	DocumentURI        string `json:"document-uri"`
	Referrer           string `json:"referrer"`
	ViolatedDirective  string `json:"violated-directive"`
	EffectiveDirective string `json:"effective-directive"`
	OriginalPolicy     string `json:"original-policy"`
	BlockedURI         string `json:"blocked-uri"`
	StatusCode         int    `json:"status-code"`
}

func ReportFromJSON(in []byte) *Report {
	var report struct {
		Report Report `json:"csp-report"`
	}

	err := json.Unmarshal(in, &report)
	if err != nil {
		panic(err)
	}

	return &report.Report
}

func (r *Report) ToJSON() []byte {
	data, err := json.Marshal(r)
	if err != nil {
		panic(err)
	}
	return data
}

// {"csp-report":{
//   "document-uri":"http://localhost:8080/test",
//   "referrer":"",
//   "violated-directive":"default-src 'none'",
//   "effective-directive":"script-src",
//   "original-policy":"default-src 'none'; report-uri http://localhost:8080/r",
//   "blocked-uri":"","
//   status-code":200}
// }
