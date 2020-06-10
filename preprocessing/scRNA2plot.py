import os, sys
from decimal import Decimal
import math
import matplotlib.pyplot as plt

fin = open(sys.argv[1])

col2idx = {}

#p_val	avg_logFC	pct.1	pct.2	p_val_adj	gene

fcPvalsSig = []
fcPvals = []


for ridx, row in enumerate(fin):

    arow = row.strip().split("\t")
    print(arow)

    if len(arow) == 0:
        continue

    if ridx == 0:

        for cidx, col in enumerate(arow):

            col2idx[col] = cidx+1

        continue

    pvalColName = None
    if "p_val_adj" in col2idx:
        pvalColName = "p_val_adj"
    elif "qvalue" in col2idx:
        pvalColName = "qvalue"

    assert(pvalColName != None)

    rowFC = float(arow[ col2idx["avg_logFC"]])
    rowPV = float(arow[ col2idx[pvalColName]])

    if rowFC == None or rowPV == None:
        continue

    if rowPV == 0:
        logRowPV = 500
    else:
        try:
            logRowPV = -math.log10(rowPV)
        except:
            print(rowPV)
            print(arow)
            exit(-1)

    if rowPV < 0.05 and abs(rowFC) >= 1.0:
        fcPvalsSig.append((rowFC, logRowPV))
    else:
        fcPvals.append((rowFC, logRowPV))

plt.scatter([x[0] for x in fcPvals], [x[1] for x in fcPvals], color="blue", label="Gene (n={})".format(len(fcPvals)))
plt.scatter([x[0] for x in fcPvalsSig], [x[1] for x in fcPvalsSig], color="red", label="Gene pVal < 0.05 &\n logFC >= 1 (n={})".format(len(fcPvalsSig)))
plt.legend(loc='lower left')
outfile = sys.argv[1] + ".volcano.png"
print(outfile)
plt.savefig(outfile, bbox_inches="tight")